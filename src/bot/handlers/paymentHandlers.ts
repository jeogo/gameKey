import { bot } from "../../bot";
import { PaymentStatus } from "../../services/NowPaymentsService";
import * as PaymentRepository from "../../repositories/PaymentRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as OrderRepository from "../../repositories/OrderRepository";
import { IPaymentTransaction } from "../../models/PaymentTransaction";
import KeyboardFactory from "../keyboards";
import { NotificationService } from "../services/NotificationService";
import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { PurchaseService } from "../services/PurchaseService";
import { handleGcoinPurchaseSuccess } from "../commands/gcoin";
import { nowPaymentsService } from "../../services/NowPaymentsService";

/**
 * Handle successful payment completion
 * Creates order, delivers digital content, and sends notifications
 */
export async function handlePaymentSuccess(transactionId: string): Promise<void> {
  try {
    // 1) Find the payment transaction
    const tx = await PaymentRepository.findTransactionById(transactionId);
    if (!tx || tx.status !== "completed") return;

    // 2) Extract purchase info from metadata
    const { userId, productId, quantity, productPrice, isPreorder } = tx.metadata || {};
    if (!userId || !productId || !quantity) return;

    // 3) Create the order in DB
    const orderType = isPreorder ? "preorder" : "purchase";
    const order = await OrderRepository.createOrder({
      userId,
      productId,
      quantity,
      unitPrice: productPrice,
      type: orderType,
      customerNote: `Payment ID: ${transactionId}` // Use customerNote instead of paymentId
    });

    // 4) Update transaction with orderId
    await PaymentRepository.updateTransaction(transactionId, {
      orderId: order._id!
    });

    // 5) Process based on product availability
    const product = await ProductRepository.findProductById(productId);
    
    // If product not found, notify admin and return
    if (!product) {
      await NotificationService.sendOrderNotification({  // Replace with existing method
        orderId: order._id!,
        userId,
        username: "system", 
        productName: "Product not found",
        quantity: 0,
        price: 0,
        totalAmount: 0,
        paymentMethod: "Unknown"
      });
      return;
    }

    // 6) Digital content delivery logic
    if (product.isAvailable && product.digitalContent?.length >= quantity) {
      // Get digital content to deliver
      const contentToDeliver = product.digitalContent.slice(0, quantity);
      
      // Update product inventory
      const updatedStock = product.digitalContent.slice(quantity);
      await ProductRepository.updateProduct(productId, {
        digitalContent: updatedStock,
        isAvailable: updatedStock.length > 0
      });

      // Send delivery message with rich formatting
      await sendDigitalContentDelivery(
        parseInt(userId),
        order._id!,
        product.name,
        contentToDeliver,
        orderType === "preorder"
      );

      // Mark order as completed
      await OrderRepository.updateOrderStatus(order._id!, "completed", "Payment confirmed, digital product delivered");
      
      // Record delivery in order history
      const contentString = contentToDeliver.join(',');
      await OrderRepository.updateOrderStatus(
        order._id!,
        "completed",
        `Digital content delivered: ${contentString}`
      );
    } else if (isPreorder) {
      // Handle preorder - send confirmation but no delivery yet
      await sendPreorderConfirmation(parseInt(userId), order._id!, product.name);
      
      // Mark as pending/preorder
      await OrderRepository.updateOrderStatus(
        order._id!,
        "pending",
        "Preorder payment confirmed, awaiting product availability"
      );
    } else {
      // Handle case where product is no longer available
      await sendProductUnavailableNotification(parseInt(userId), order._id!, product.name);
      
      // Mark order as pending admin action
      await OrderRepository.updateOrderStatus(
        order._id!,
        "pending",
        "Payment confirmed but product no longer available"
      );
      
      // Alert admin about inventory issue
      await NotificationService.sendOrderNotification({  // Use existing method instead
        orderId: order._id!,
        userId,
        username: "system",
        productName: product.name + " (INVENTORY ISSUE)",
        quantity: quantity,
        price: productPrice,
        totalAmount: quantity * productPrice,
        paymentMethod: tx.paymentProvider || "Unknown"
      });
    }

    // 7) Notify admin about completed payment
    await NotificationService.sendOrderNotification({
      orderId: order._id!,
      userId: userId,
      username: "user", // You may need to fetch username separately
      productName: product.name,
      quantity: quantity,
      price: productPrice,
      totalAmount: quantity * productPrice,
      paymentMethod: tx.paymentProvider
    });

  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

/**
 * Handle failed payments
 */
export async function handlePaymentFailure(transactionId: string, reason?: string): Promise<void> {
  try {
    const tx = await PaymentRepository.findTransactionById(transactionId);
    if (!tx) return;

    const { userId } = tx.metadata || {};
    if (!userId) return;

    // Update transaction status
    await PaymentRepository.updateTransactionStatus(
      transactionId,
      "failed",
      { metadata: { failureReason: reason || "Unknown error" } }  // Put into metadata instead
    );

    // Notify user about payment failure
    await bot.api.sendMessage(
      parseInt(userId),
      `❌ *Payment Failed*\n\n` +
      `We couldn't process your payment of $${tx.amount}.\n\n` +
      `${reason ? `Reason: ${reason}\n\n` : ''}` +
      `Please try again or contact support for assistance.`,
      { parse_mode: "Markdown", reply_markup: KeyboardFactory.support() }
    );
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}

/**
 * Send digital content to the user after successful payment
 */
async function sendDigitalContentDelivery(
  userId: number,
  orderId: string,
  productName: string,
  digitalContent: string[],
  wasPreorder: boolean = false
): Promise<void> {
  try {
    // Create message with product details and digital content
    let message = wasPreorder ? 
      `🎮 *YOUR PRE-ORDER IS READY!*\n\n` :
      `🎮 *ORDER COMPLETED - DELIVERY*\n\n`;

    message += `*Order ID:* #${orderId.slice(-6)}\n`;
    message += `*Product:* ${productName}\n\n`;
    message += `🔐 *YOUR DIGITAL PRODUCT DETAILS*\n\n`;
    message += `Here are your login details for ${productName}:\n\n`;

    // Format each digital content item
    digitalContent.forEach((item, index) => {
      try {
        // Try to split into email:password format
        const [email, password] = item.split(':');
        message += `*Item ${index + 1}:*\n`;
        message += `Email: \`${email}\`\n`;
        message += `Password: \`${password}\`\n\n`;
      } catch (e) {
        // Fallback if splitting fails
        message += `*Item ${index + 1}:* \`${item}\`\n\n`;
      }
    });

    // Send the message
    await bot.api.sendMessage(userId, message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.mainMenu()
    });
  } catch (error) {
    console.error(`Failed to send digital content to user ${userId}:`, error);
  }
}

/**
 * Send preorder confirmation after successful payment
 */
async function sendPreorderConfirmation(
  userId: number,
  orderId: string,
  productName: string
): Promise<void> {
  try {
    const message = `
⏳ *PRE-ORDER CONFIRMED*

Thank you for your pre-order of *${productName}*!

*Order ID:* #${orderId.slice(-6)}

Your payment has been confirmed and your order is now in our system. We'll deliver your digital content as soon as it becomes available.

You'll receive a notification when your pre-order is ready for delivery.
`;

    await bot.api.sendMessage(userId, message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.mainMenu()
    });
  } catch (error) {
    console.error(`Failed to send preorder confirmation to user ${userId}:`, error);
  }
}

/**
 * Send notification when product becomes unavailable after payment
 */
async function sendProductUnavailableNotification(
  userId: number,
  orderId: string,
  productName: string
): Promise<void> {
  try {
    const message = `
⚠️ *ORDER STATUS UPDATE*

Your payment for *${productName}* has been confirmed, but we're experiencing an inventory issue.

*Order ID:* #${orderId.slice(-6)}

Our team has been notified and will resolve this as soon as possible. We'll deliver your product shortly or contact you with alternative options.

We apologize for any inconvenience.
`;

    await bot.api.sendMessage(userId, message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.support()
    });
  } catch (error) {
    console.error(`Failed to send product unavailable notice to user ${userId}:`, error);
  }
}

/**
 * Process webhook notifications from payment providers
 */
export async function processPaymentWebhook(
  provider: string,
  eventData: any
): Promise<boolean> {
  try {
    // Only handle NOWPayments webhooks
    if (provider === 'nowpayments') {
      // Process NOWPayments webhook
      const paymentId = eventData.payment_id;
      
      if (paymentId) {
        const tx = await PaymentRepository.findTransactionByExternalId(paymentId);
        if (tx && tx.status !== 'completed') {
          // Update transaction status
          await PaymentRepository.updateTransactionStatus(tx._id!, 'completed');
          
          // Process the successful payment
          await handlePaymentSuccess(tx._id!);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error processing payment webhook:", error);
    return false;
  }
}

/**
 * Register all payment related handlers
 */
export function registerPaymentHandlers(bot: Bot<MyContext>): void {
  // Handle payment confirmation clicked by user
  bot.callbackQuery(/^check_payment_(.+)$/, async (ctx) => {
    const paymentId = ctx.match![1];
    
    try {
      // Get transaction from database
      const transaction = await PaymentRepository.findTransactionById(paymentId);
      
      if (!transaction) {
        await ctx.editMessageText("Payment transaction not found. Please try again or contact support.");
        await ctx.answerCallbackQuery("Transaction not found");
        return;
      }
      
      // Check payment status via API
      const providerStatus = await nowPaymentsService.getPaymentStatus(transaction.providerTransactionId || "");
      
      // Update our transaction status
      await PaymentRepository.updateTransactionStatus(
        paymentId,
        providerStatus,
        { updatedAt: new Date() }
      );
      
      // Handle based on status
      if (providerStatus === 'completed') {
        // Check if this is a GCoin purchase
        if (transaction.metadata?.type === 'buy_gcoin') {
          // Handle GCoin purchase
          const gcoinAmount = transaction.metadata.gcoinAmount;
          const success = await handleGcoinPurchaseSuccess(
            transaction.userId,
            gcoinAmount,
            paymentId
          );
          
          if (success) {
            await ctx.editMessageText(
              "✅ Payment verified and GCoin has been successfully added to your balance!",
              { reply_markup: { inline_keyboard: [] } }
            );
          } else {
            await ctx.editMessageText(
              "⚠️ Payment verified but there was an error adding GCoin. Please contact support.",
              { reply_markup: { inline_keyboard: [] } }
            );
          }
        } else {
          // Regular product purchase
          // Handle order creation and product delivery
          // (implementation depends on your order processing logic)
          
          await ctx.editMessageText(
            "✅ Payment verified. Your order is now being processed...",
            { reply_markup: { inline_keyboard: [] } }
          );
          
          // Create order if needed
          // Deliver digital product if available
          // TODO: Implement your order processing logic
        }
      } else if (providerStatus === 'pending') {
        await ctx.editMessageText(
          "⌛ Payment is being processed. Please wait and check again after a few minutes.",
          { reply_markup: { inline_keyboard: [ [{ text: "✅ Check Again", callback_data: `check_payment_${paymentId}` }] ] } }
        );
      } else {
        // Failed, cancelled, etc.
        await ctx.editMessageText(
          "❌ Payment failed or was cancelled. Please try again or contact support.",
          { reply_markup: { inline_keyboard: [] } }
        );
      }
      
      await ctx.answerCallbackQuery("Payment status checked!");
    } catch (error) {
      console.error("Error checking payment status:", error);
      await ctx.editMessageText("An error occurred while checking the payment status. Please try again later.");
      await ctx.answerCallbackQuery("An error occurred");
    }
  });
  
  // Handle purchase confirmation for GCoin
  bot.callbackQuery(/^confirm_gcoin_purchase_(.+)_(\d+)$/, async (ctx) => {
    try {
      const productId = ctx.match![1];
      const quantity = parseInt(ctx.match![2]);
      
      // Check if quantity is valid
      if (isNaN(quantity) || quantity <= 0) {
        await ctx.answerCallbackQuery("Invalid quantity");
        return;
      }
      
      // Update message while processing
      await ctx.editMessageText("Processing your request, please wait...");
      
      // Complete purchase with GCoin
      const success = await PurchaseService.completePurchaseWithGcoin(ctx, productId, quantity);
      
      // Result is handled inside completePurchaseWithGcoin method
      await ctx.answerCallbackQuery(success ? "Purchase completed!" : "An error occurred while processing the request");
      
    } catch (error) {
      console.error("Error confirming GCoin purchase:", error);
      await ctx.reply("An error occurred while processing the purchase request. Please try again later.");
      await ctx.answerCallbackQuery("An error occurred");
    }
  });
  
  // Handle payment confirmation clicked by user (legacy/non-GCoin purchase)
  bot.callbackQuery(/^confirm_purchase_(.+)_(\d+)$/, async (ctx) => {
    try {
      const productId = ctx.match![1];
      const quantity = parseInt(ctx.match![2]);
      
      // Check if quantity is valid
      if (isNaN(quantity) || quantity <= 0) {
        await ctx.answerCallbackQuery("Invalid quantity");
        return;
      }
      
      // Update message while processing
      await ctx.editMessageText("Processing your request, please wait...");
      
      // Enforce GCoin-only purchase
      const success = await PurchaseService.initiateProductPurchaseWithGcoin(ctx, productId, quantity);
      
      // Result is handled inside initiateProductPurchaseWithGcoin method
      await ctx.answerCallbackQuery(success ? "Order processed!" : "An error occurred");
      
    } catch (error) {
      console.error("Error confirming purchase:", error);
      await ctx.reply("An error occurred while processing the purchase request. Please try again later.");
      await ctx.answerCallbackQuery("An error occurred");
    }
  });
  
  // Handle purchase cancellation
  bot.callbackQuery("cancel_purchase", async (ctx) => {
    await ctx.editMessageText("Order has been cancelled. You can continue browsing or choose another product.");
    await ctx.answerCallbackQuery("Cancelled");
  });
  
  // Handle payment cancellation
  bot.callbackQuery(/^cancel_payment_(.+)$/, async (ctx) => {
    const paymentId = ctx.match![1];
    
    try {
      // Update payment status in database
      await PaymentRepository.updateTransactionStatus(
        paymentId,
        'cancelled',
        { updatedAt: new Date() }
      );
      
      await ctx.editMessageText("Payment has been cancelled. You can continue browsing or try again later.");
      await ctx.answerCallbackQuery("Payment cancelled");
    } catch (error) {
      console.error("Error cancelling payment:", error);
      await ctx.reply("An error occurred while cancelling the payment. Please try again.");
      await ctx.answerCallbackQuery("An error occurred");
    }
  });
  
  // Handle direct purchases with GCoin
  bot.callbackQuery(/^purchase_gcoin_(.+)$/, async (ctx) => {
    try {
      const productId = ctx.match![1];
      
      // Default to quantity 1 for direct purchases
      const quantity = 1;
      
      // Initiate GCoin product purchase
      const success = await PurchaseService.initiateProductPurchaseWithGcoin(ctx, productId, quantity);
      
      // Result is handled inside initiateProductPurchaseWithGcoin method
      await ctx.answerCallbackQuery(success ? "Preparing your order" : "An error occurred");
      
    } catch (error) {
      console.error("Error initiating GCoin purchase:", error);
      await ctx.reply("An error occurred while preparing the purchase. Please try again later.");
      await ctx.answerCallbackQuery("An error occurred");
    }
  });
}
