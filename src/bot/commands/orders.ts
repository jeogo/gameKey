import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as UserRepository from "../../repositories/UserRepository";

// ===========================
// ORDER DISPLAY CONFIGURATION
// ===========================

const ORDERS_PER_PAGE = 5;
const ORDER_STATUS_EMOJIS = {
  'pending': '⏳',
  'paid': '💰',
  'delivered': '✅',
  'cancelled': '❌',
} as const;

const ORDER_STATUS_DESCRIPTIONS = {
  'pending': 'Being processed',
  'paid': 'Payment confirmed',
  'delivered': 'Delivered successfully', 
  'cancelled': 'Order cancelled',
} as const;

// ===========================
// MAIN ORDER DISPLAY FUNCTIONS
// ===========================

/**
 * Display paginated order history with proper organization
 */
export async function showOrdersPage(ctx: MyContext, userId: string, page: number = 1): Promise<void> {
  try {
    const pageSize = ORDERS_PER_PAGE;
  
    // Get paginated orders
    const result = await OrderRepository.findOrdersByUserId(userId, page, pageSize);
    
    if (result.orders.length === 0 && page === 1) {
      // No orders at all
      const message = "📭 **NO HISTORIC ORDERS FOUND**\n\n" +
        "You don't have any orders yet.\n\n" +
        "🛍️ Use the Products menu to browse our catalog and make your first purchase!";
        
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { parse_mode: "Markdown" });
      } else {
        await ctx.reply(message, { parse_mode: "Markdown" });
      }
      return;
    }
    
    if (result.orders.length === 0 && page > 1) {
      // Trying to access a page that doesn't exist, go back to page 1
      return showOrdersPage(ctx, userId, 1);
    }
    
    // Build organized orders display
    let ordersText = "📋 **YOUR ORDER HISTORY**\n";
    ordersText += "═══════════════════════\n\n";
    ordersText += "Track your past purchases and their status:\n\n";
    
    // Add each order with clean formatting
    for (const order of result.orders) {
      const product = await ProductRepository.findProductById(order.productId);
      const productName = product ? product.name : "Unknown Product";
      
      const statusEmoji = ORDER_STATUS_EMOJIS[order.status] || '⏳';
      const statusDesc = ORDER_STATUS_DESCRIPTIONS[order.status] || 'Processing';
      
      ordersText += `${statusEmoji} **Order #${order._id?.slice(-6)}**\n`;
      ordersText += `📦 ${productName}\n`;
      ordersText += `💰 $${order.totalAmount.toFixed(2)} • Qty: ${order.quantity}\n`;
      ordersText += `📅 ${new Date(order.createdAt).toLocaleDateString()}\n`;
      ordersText += `📊 Status: ${statusDesc}\n`;
      ordersText += `▫️ Click to view details\n\n`;
    }
    
    // Add pagination info
    const totalPages = Math.ceil(result.total / pageSize);
    ordersText += `\n📄 Page ${page} of ${totalPages} • Total: ${result.total} orders`;
    
    // Create navigation keyboard
    const keyboard = new InlineKeyboard();
    
    // Add order detail buttons
    result.orders.forEach(order => {
      const statusEmoji = ORDER_STATUS_EMOJIS[order.status] || '⏳';
      keyboard.text(`${statusEmoji} #${order._id?.slice(-6)}`, `order_${order._id}`).row();
    });
    
    // Add pagination if needed
    if (totalPages > 1) {
      const navRow: any[] = [];
      
      if (page > 1) {
        navRow.push({ text: "⬅️ Previous", callback_data: `orders_page_${page - 1}` });
      }
      
      if (page < totalPages) {
        navRow.push({ text: "Next ➡️", callback_data: `orders_page_${page + 1}` });
      }
      
      if (navRow.length > 0) {
        keyboard.row(...navRow.map(btn => ({ text: btn.text, callback_data: btn.callback_data })));
      }
    }
    
    // Add main menu button
    keyboard.text("🏠 Main Menu", "main_menu");
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(ordersText, { 
        parse_mode: "Markdown", 
        reply_markup: keyboard 
      });
    } else {
      await ctx.reply(ordersText, { 
        parse_mode: "Markdown", 
        reply_markup: keyboard 
      });
    }
    
  } catch (error) {
    console.error('Error displaying orders page:', error);
    const errorMsg = "❌ **ERROR LOADING ORDERS**\n\nPlease try again or contact support.";
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg, { parse_mode: "Markdown" });
    } else {
      await ctx.reply(errorMsg, { parse_mode: "Markdown" });
    }
  }
}

/**
 * Show detailed information for a specific order
 */
export async function showOrderDetail(ctx: MyContext, orderId: string): Promise<void> {
  try {
    const order = await OrderRepository.findOrderById(orderId);
    
    if (!order || order.userId !== ctx.from?.id.toString()) {
      const errorMsg = "❌ Order not found or access denied.";
      
      if (ctx.callbackQuery) {
        await ctx.editMessageText(errorMsg);
      } else {
        await ctx.reply(errorMsg);
      }
      return;
    }
    
    // Get product details
    const product = await ProductRepository.findProductById(order.productId);
    const productName = product ? product.name : "Unknown Product";
    
    const statusEmoji = ORDER_STATUS_EMOJIS[order.status] || '⏳';
    const statusDesc = ORDER_STATUS_DESCRIPTIONS[order.status] || 'Processing';
    
    // Build detailed order information
    let orderDetails = `📋 **ORDER DETAILS**\n`;
    orderDetails += `═══════════════════════\n\n`;
    orderDetails += `🆔 **Order ID:** #${order._id?.slice(-6)}\n`;
    orderDetails += `📦 **Product:** ${productName}\n`;
    orderDetails += `📊 **Status:** ${statusEmoji} ${statusDesc}\n`;
    orderDetails += `💰 **Unit Price:** $${order.unitPrice.toFixed(2)}\n`;
    orderDetails += `📦 **Quantity:** ${order.quantity}\n`;
    orderDetails += `💵 **Total Amount:** $${order.totalAmount.toFixed(2)}\n`;
    orderDetails += `📅 **Order Date:** ${new Date(order.createdAt).toLocaleDateString()}\n`;
    // Simplified Order model - type field removed
    
    // Simplified Order model - customerNote field removed
    
    // Add status-specific information
    if (order.status === "delivered") {
      orderDetails += `\n✅ **ORDER DELIVERED**\n`;
      orderDetails += `📅 Delivered successfully!\n`;
      
      // Show delivered digital content
      if (order.deliveredContent && order.deliveredContent.length > 0) {
        orderDetails += `\n🔐 **YOUR DIGITAL PRODUCT:**\n\n`;
        
        order.deliveredContent.forEach((item: string, index: number) => {
          try {
            const [email, password] = item.trim().split(':');
            orderDetails += `**Item ${index + 1}:**\n`;
            orderDetails += `📧 Email: \`${email}\`\n`;
            orderDetails += `🔑 Password: \`${password}\`\n\n`;
          } catch (e) {
            orderDetails += `**Item ${index + 1}:** \`${item.trim()}\`\n\n`;
          }
        });
      } else {
        orderDetails += `\n💬 Your product details were delivered. Check your message history or contact support.`;
      }
      
    } else if (order.status === "pending") {
      orderDetails += `\n⏳ **ORDER PENDING**\n`;
      orderDetails += ` Your order is being processed. Please wait for completion.`;
      
    } else if (order.status === "paid") {
      orderDetails += `\n💰 **PAYMENT CONFIRMED**\n`;
      orderDetails += `� Processing your order. You'll receive your digital product soon!`;
      
    } else if (order.status === "cancelled") {
      orderDetails += `\n❌ **ORDER CANCELLED**\n`;
      orderDetails += `� This order was cancelled and no product was delivered.`;
    }
    
    // Create back navigation keyboard
    const keyboard = new InlineKeyboard()
      .text("📋 Back to Orders", `orders_page_1`)
      .text("🏠 Main Menu", "main_menu");
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(orderDetails, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    } else {
      await ctx.reply(orderDetails, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    
  } catch (error) {
    console.error("Error fetching order details:", error);
    const errorMsg = "❌ **ERROR LOADING ORDER**\n\nUnable to retrieve order details. Please try again.";
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg, { parse_mode: "Markdown" });
    } else {
      await ctx.reply(errorMsg, { parse_mode: "Markdown" });
    }
  }
}

// ===========================
// COMMAND REGISTRATION
// ===========================

/**
 * Register all order-related commands and callback handlers
 */
export function registerOrdersCommand(bot: Bot<MyContext>): void {
  // Main orders command
  bot.command("orders", async (ctx) => {
    if (!ctx.from?.id) {
      await ctx.reply("❌ Unable to identify user.");
      return;
    }

    try {
      const userId = ctx.from.id.toString();
      await showOrdersPage(ctx, userId, 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
      await ctx.reply("❌ Sorry, an error occurred while retrieving your orders.");
    }
  });

  // Handle order page navigation
  bot.callbackQuery(/^orders_page_(\d+)$/, async (ctx) => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery("❌ User not found");
      return;
    }
    
    try {
      const pageNumber = parseInt(ctx.match[1]);
      const userId = ctx.from.id.toString();
      
      await showOrdersPage(ctx, userId, pageNumber);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error navigating orders:", error);
      await ctx.answerCallbackQuery("❌ Error loading orders. Please try again.");
    }
  });

  // Handle viewing a specific order
  bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery("❌ User not found");
      return;
    }
    
    try {
      const orderId = ctx.match[1];
      await showOrderDetail(ctx, orderId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing order details:", error);
      await ctx.answerCallbackQuery("❌ Error loading order details. Please try again.");
    }
  });
}