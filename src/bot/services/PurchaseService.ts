import { MyContext } from "../types/session";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as OrderRepository from "../../repositories/OrderRepository";
import KeyboardFactory from "../keyboards";
import { NotificationService } from "./NotificationService";
import { bot } from "../../bot";
import { paymentProcessor } from "../../services/PaymentProcessor";
import * as PaymentRepository from "../../repositories/PaymentRepository";
import { IPaymentTransaction } from "../../models/PaymentTransaction";

/**
 * Service to handle the product purchase flow
 */
export class PurchaseService {
  /**
   * Initiate purchase for a product
   * @returns true if successful, false if error
   */
  static async initiateProductPurchase(
    ctx: MyContext,
    productId: string,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      // Check if product exists and is available
      const product = await ProductRepository.findProductById(productId);
      
      if (!product) {
        await ctx.reply("Sorry, this product was not found.");
        return false;
      }
      
      if (!product.isAvailable && !product.allowPreorder) {
        await ctx.reply("Sorry, this product is currently not available for purchase.");
        return false;
      }
      
      // Check if user exists in context
      if (!ctx.from?.id) {
        await ctx.reply("Unable to identify user. Please try again.");
        return false;
      }
      
      const userId = ctx.from.id.toString();
      
      // Check if sufficient quantity is available
      if (product.isAvailable && (!product.digitalContent || product.digitalContent.length < quantity)) {
        await ctx.reply(`Sorry, we don't have enough of this product in stock right now. Currently available: ${product.digitalContent?.length || 0}. Please try again with a smaller quantity or contact support.`);
        return false;
      }
      
      // Calculate total amount
      const totalAmount = quantity * product.price;
      
      // Create payment request
      const paymentOptions = {
        amount: totalAmount,
        currency: "USD",
        description: `Purchase of ${product.name}`,
        successUrl: process.env.PAYPAL_SUCCESS_URL || "https://gamekey.onrender.com/payment/success",
        cancelUrl: process.env.PAYPAL_CANCEL_URL || "https://gamekey.onrender.com/payment/cancel",
        metadata: {
          userId,
          productId,
          quantity,
          productPrice: product.price,
          isPreorder: !product.isAvailable
        }
      };
      
      const paymentTx = await paymentProcessor.createPayment(paymentOptions);

      // Save transaction in DB (no order creation yet)
      const savedTx = await PaymentRepository.createTransaction({
        ...paymentTx,
        userId,
        orderId: "", // Will be filled in after payment
        paymentProvider: "paypal",
        amount: paymentTx.amount,
        currency: paymentTx.currency,
        status: "pending",
        metadata: paymentTx.metadata
      } as IPaymentTransaction);

      // Send an attractive payment page with buttons
      await ctx.reply(
        `🔐 *Secure Payment Gateway*\n\n` +
        `Your order for *${product.name}* is ready!\n\n` + 
        `Total: $${totalAmount.toFixed(2)}\n` +
        `Please click the button below to complete your payment.`,
        {
          parse_mode: "Markdown",
          reply_markup: KeyboardFactory.paymentLink(savedTx.paymentUrl!, savedTx._id!)
        }
      );

      return true;
    } catch (error) {
      console.error("Error initiating product purchase:", error);
      
      // Show error message to user
      await ctx.reply("Sorry, something went wrong while processing your purchase request. Please try again later.");
      
      return false;
    }
  }

  /**
   * Request confirmation from the user before proceeding with purchase
   */
  static async requestPurchaseConfirmation(
    ctx: MyContext,
    productId: string,
    quantity: number = 1
  ): Promise<void> {
    // Get product details for a rich confirmation message
    const product = await ProductRepository.findProductById(productId);
    if (!product) {
      await ctx.reply("Sorry, this product was not found.");
      return;
    }

    const totalAmount = quantity * product.price;
    
    // Create an appealing confirmation message
    const message = `
🛒 *PURCHASE CONFIRMATION*

*${product.name}*
${product.description ? `\n${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}` : ''}

💰 *Price:* $${product.price.toFixed(2)} each
📦 *Quantity:* ${quantity}
💵 *Total:* $${totalAmount.toFixed(2)}

Are you sure you want to proceed with this purchase?`;

    // Send confirmation with attractive buttons
    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.paymentConfirmation(product.name, productId, quantity)
    });
  }
  
  /**
   * Show the order confirmation with details to the user
   */
  private static async showOrderConfirmation(ctx: MyContext, orderId: string): Promise<void> {
    try {
      const order = await OrderRepository.findOrderById(orderId);
      
      if (!order) {
        await ctx.reply("Order not found. Please try again.");
        return;
      }
      
      const product = await ProductRepository.findProductById(order.productId);
      
      if (!product) {
        await ctx.reply("Product information not available. Your order has been placed.");
        return;
      }
      
      // Prepare the confirmation message
      const isPreorder = order.type === "preorder";
      const orderTypeEmoji = isPreorder ? "⏳ PRE-ORDER" : "✅ PURCHASE";
      const orderTypeNote = isPreorder 
        ? (product.preorderNote || "This item will be delivered when in stock.")
        : "Your order has been processed and is now ready.";
      
      const confirmationMessage = `
🎮 *ORDER CONFIRMATION*

${orderTypeEmoji} *#${order._id?.slice(-6)}*

*Product:* ${product.name}
*Quantity:* ${order.quantity}
*Price:* $${order.unitPrice.toFixed(2)} each
*Total:* $${order.totalAmount.toFixed(2)}

${orderTypeNote}

Use /orders to view all your orders and their status.
`;
      
      // Send confirmation to user
      await ctx.reply(confirmationMessage, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.backToMain()
      });
      
    } catch (error) {
      console.error("Error showing order confirmation:", error);
      await ctx.reply("Your order has been placed. Use /orders to view your order details.");
    }
  }
  

  /**
   * Complete an order (mark as fulfilled)
   */
  static async completeOrder(orderId: string, note?: string): Promise<boolean> {
    try {
      const updatedOrder = await OrderRepository.updateOrderStatus(
        orderId,
        "completed",
        note || "Order marked as completed"
      );
      
      return !!updatedOrder;
    } catch (error) {
      console.error("Error completing order:", error);
      return false;
    }
  }
  
  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string, note?: string): Promise<boolean> {
    try {
      const updatedOrder = await OrderRepository.updateOrderStatus(
        orderId,
        "cancelled",
        note || "Order cancelled"
      );
      
      return !!updatedOrder;
    } catch (error) {
      console.error("Error cancelling order:", error);
      return false;
    }
  }
  
  /**
   * Notify admin about a new order
   */
  private static async notifyAdminAboutOrder(
    orderId: string,
    userId: string,
    username: string | undefined,
    productName: string,
    quantity: number,
    price: number,
    totalAmount: number,
    orderType: string,
    digitalContent?: string[],
    inventoryBefore?: number,
    inventoryAfter?: number
  ): Promise<void> {
    try {
      if (orderType === "preorder") {
        await NotificationService.sendPreorderNotification({
          orderId,
          userId,
          username,
          productName,
          quantity,
          price,
          totalAmount
        });
      } else {
        await NotificationService.sendOrderNotification({
          orderId,
          userId,
          username,
          productName,
          quantity,
          price,
          totalAmount,
          paymentMethod: "Direct Purchase",
          digitalContent,
          inventoryBefore,
          inventoryAfter
        });
      }
    } catch (error) {
      console.error("Error notifying admin about order:", error);
    }
  }
  
  /**
   * Add a note to an order
   */
  static async addOrderNote(ctx: MyContext, note: string): Promise<void> {
    ctx.session.tempData = ctx.session.tempData || {};
    ctx.session.tempData.orderNote = note;
    
    await ctx.reply("Your note has been added to the order.");
  }

  /**
   * Process a preorder when product becomes available
   */
  static async processPreorder(orderId: string): Promise<boolean> {
    try {
      const order = await OrderRepository.findOrderById(orderId);
      
      if (!order || order.type !== "preorder" || order.status !== "pending") {
        console.log("Invalid order for preorder processing:", orderId);
        return false;
      }
      
      const product = await ProductRepository.findProductById(order.productId);
      
      if (!product || !product.isAvailable) {
        console.log("Product not available for preorder processing:", order.productId);
        return false;
      }
      
      // Check if sufficient digital content is available
      if (!product.digitalContent || product.digitalContent.length < order.quantity) {
        console.log("Not enough digital content for preorder:", order.productId);
        return false;
      }
      
      // Get digital content for delivery
      const contentToDeliver = product.digitalContent.slice(0, order.quantity);
      
      // Store inventory information before update
      const inventoryBefore = product.digitalContent.length;
      
      // Update product's digital content
      const updatedDigitalContent = product.digitalContent.slice(order.quantity);
      await ProductRepository.updateProduct(product._id!, {
        digitalContent: updatedDigitalContent,
        isAvailable: updatedDigitalContent.length > 0
      });
      
      // Store inventory information after update
      const inventoryAfter = updatedDigitalContent.length;
      
      // Mark order as complete
      await OrderRepository.updateOrderStatus(
        orderId,
        "completed",
        "Preorder fulfilled with digital content"
      );
      
      // Attempt to notify user that their preorder is ready
      try {
        // Send a single combined message with order and content
        let message = `
🎮 *YOUR PRE-ORDER IS READY!*

*Order ID:* #${orderId.slice(-6)}
*Product:* ${product.name}
*Quantity:* ${order.quantity}
*Price:* $${order.unitPrice.toFixed(2)} each
*Total:* $${order.totalAmount.toFixed(2)}

`;

        message += `
🔐 *YOUR DIGITAL PRODUCT DETAILS*

Here are your login details for ${product.name}:

`;

        // Add each digital content item
        contentToDeliver.forEach((item, index) => {
          try {
            // Try to split data into email:password format
            const [email, password] = item.split(':');
            message += `*Item ${index + 1}:*\n`;
            message += `Email: \`${email}\`\n`;
            message += `Password: \`${password}\`\n\n`;
          } catch (e) {
            // Use fallback format if splitting fails
            message += `*Item ${index + 1}:* \`${item}\`\n\n`;
          }
        });
        
        await bot.api.sendMessage(parseInt(order.userId), message, {
          parse_mode: "Markdown",
        });
        
        // Store digital content in order status with the same format
        // This ensures we can retrieve it the same way in both purchase and preorder cases
        const digitalContentString = contentToDeliver.join(',');
        await OrderRepository.updateOrderStatus(
          orderId, 
          "completed", 
          `Preorder fulfilled with digital content. Content: ${digitalContentString}`
        );
        
        // Notify admin about preorder completion with content details
        await NotificationService.sendPreorderCompletionNotification(
          parseInt(order.userId),
          {
            orderId: orderId,
            productName: product.name,
            digitalContent: contentToDeliver,
            inventoryBefore: inventoryBefore,
            inventoryAfter: inventoryAfter
          }
        );
        
      } catch (error) {
        console.error("Error sending preorder completion notification:", error);
      }
      
      return true;
    } catch (error) {
      console.error("Error processing preorder:", error);
      return false;
    }
  }
}
