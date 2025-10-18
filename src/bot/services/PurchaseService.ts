import { MyContext } from "../types/session";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as UserRepository from "../../repositories/UserRepository";
import { NotificationService } from "./NotificationService";
import KeyboardFactory from "../keyboards";

export class PurchaseService {
  static async initiateProductPurchase(
    ctx: MyContext,
    productId: string,
    quantity: number = 1
  ): Promise<boolean> {
    try {
      const product = await ProductRepository.findProductById(productId);

      if (!product) {
        await ctx.reply("❌ Product not found. Please try again.");
        return false;
      }

      if (!product.isAvailable) {
        await ctx.reply("❌ This product is currently not available for purchase.");
        return false;
      }

      if (!ctx.from?.id) {
        await ctx.reply("❌ Unable to identify user. Please try again.");
        return false;
      }

      let user = await UserRepository.findUserByTelegramId(ctx.from.id);
      if (!user) {
        user = await UserRepository.createOrUpdateUser({
          telegramId: ctx.from.id,
          username: ctx.from.username || "Unknown"
        });
      }

      if (!user || !user._id) {
        await ctx.reply("❌ Unable to process user information. Please try again.");
        return false;
      }

      const totalAmount = quantity * product.price;
      const orderType = product.isAvailable ? "purchase" : "preorder";

      const order = await OrderRepository.createOrder({
        userId: user._id,
        productId: product._id!,
        quantity,
        unitPrice: product.price
      });

      if (!order || !order._id) {
        await ctx.reply("❌ Failed to create order. Please try again.");
        return false;
      }

      ctx.session.tempData = ctx.session.tempData || {};
      ctx.session.tempData.pendingOrderId = order._id;

      await this.requestPurchaseConfirmation(ctx, productId, quantity);

      return true;
    } catch (error) {
      console.error("Error initiating product purchase:", error);
      await ctx.reply("❌ An error occurred while processing your purchase. Please try again.");
      return false;
    }
  }

  static async requestPurchaseConfirmation(
    ctx: MyContext,
    productId: string,
    quantity: number = 1
  ): Promise<void> {
    const product = await ProductRepository.findProductById(productId);
    if (!product) {
      await ctx.reply("❌ Product not found.");
      return;
    }

    const totalAmount = quantity * product.price;

    const message = `
🛒 *Purchase Confirmation*

*${product.name}*
${product.description ? `\n${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}` : ''}

💰 *Price:* $${product.price} each
📦 *Quantity:* ${quantity}
💵 *Total:* $${totalAmount}

Are you sure you want to proceed with this purchase?`;

    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.paymentConfirmation(product.name, productId, quantity)
    });
  }

  static async completeOrder(orderId: string): Promise<boolean> {
    try {
      const updatedOrder = await OrderRepository.updateOrderStatus(
        orderId,
        'delivered'
      );

      return !!updatedOrder;
    } catch (error) {
      console.error("Error completing order:", error);
      return false;
    }
  }

  static async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const updatedOrder = await OrderRepository.updateOrderStatus(
        orderId,
        'cancelled'
      );

      return !!updatedOrder;
    } catch (error) {
      console.error("Error cancelling order:", error);
      return false;
    }
  }
}
