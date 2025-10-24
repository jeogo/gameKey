import { Bot, InlineKeyboard } from 'grammy';
import { MyContext } from '../types/session';
import * as OrderRepository from '../../repositories/OrderRepository';
import * as ProductRepository from '../../repositories/ProductRepository';
import { createBackKeyboard } from '../keyboards/persistentKeyboard';
import { formatMessage } from '../../config/botConfig';

// ===========================
// 🎯 PROFESSIONAL ORDER DISPLAY SYSTEM
// ===========================

const ORDERS_PER_PAGE = 5; // Optimized page size for better UX

// 🎨 Professional Status Emojis
const ORDER_STATUS_EMOJIS = {
  pending: '⏳',
  paid: '�',
  delivered: '🚀',
  cancelled: '❌',
  completed: '✅',
} as const;

// 📋 Professional Status Messages
const ORDER_STATUS_DESCRIPTIONS = {
  pending: '⚡ Processing Your Order',
  paid: '💎 Payment Confirmed',
  delivered: '🚀 Successfully Delivered',
  cancelled: '❌ Order Cancelled',
  completed: '✅ Order Complete',
} as const;

// ===========================
// MAIN ORDER DISPLAY FUNCTIONS
// ===========================

/**
 * Display paginated order history with proper organization
 */
export async function showOrdersPage(
  ctx: MyContext,
  userId: string,
  page: number = 1
): Promise<void> {
  try {
    const pageSize = ORDERS_PER_PAGE;

    // Get paginated orders
    const result = await OrderRepository.findOrdersByUserId(userId, page, pageSize);

    // Get only completed orders
    const completedOrders = result.orders.filter(
      order => order.status === 'delivered' || order.status === 'paid'
    );

    if (completedOrders.length === 0) {
      // No completed orders
      if (ctx.callbackQuery) {
        await ctx.editMessageText(formatMessage('ORDERS_NO_ORDERS'));
      } else {
        await ctx.reply(formatMessage('ORDERS_NO_ORDERS'), {
          reply_markup: createBackKeyboard(),
        });
      }
      return;
    }

    if (result.orders.length === 0 && page > 1) {
      // Trying to access a page that doesn't exist, go back to page 1
      return showOrdersPage(ctx, userId, 1);
    }

    // Build simple orders display
    let ordersText = formatMessage('ORDERS_HEADER');

    // Add each completed order
    for (const order of completedOrders.slice(0, 10)) {
      // Show max 10 orders
      const product = await ProductRepository.findProductById(order.productId);
      const productName = product ? product.name : 'Unknown Product';

      ordersText += formatMessage('ORDER_ITEM', {
        orderNumber: order._id?.toString().slice(-6) || 'N/A',
        productName: productName,
        amount: `$${order.totalAmount.toFixed(2)} USD`,
        date: new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        status: order.status === 'delivered' ? '🚀 Delivered' : '✅ Completed',
      });
    }

    // Professional summary footer
    ordersText += `
━━━━━━━━━━━━━━━━━━━━
📊 **Order Summary:**
✅ **Total Purchases:** ${completedOrders.length}
💎 **Account Status:** VIP Member
━━━━━━━━━━━━━━━━━━━━`;

    // Send message with back button
    if (ctx.callbackQuery) {
      await ctx.editMessageText(ordersText);
    } else {
      await ctx.reply(ordersText, { reply_markup: createBackKeyboard() });
    }
  } catch (error) {
    console.error('Error displaying orders:', error);

    if (ctx.callbackQuery) {
      await ctx.editMessageText(formatMessage('ERROR_GENERIC'));
    } else {
      await ctx.reply(formatMessage('ERROR_GENERIC'), { reply_markup: createBackKeyboard() });
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
      const errorMsg = '❌ Order not found or access denied.';

      if (ctx.callbackQuery) {
        await ctx.editMessageText(errorMsg);
      } else {
        await ctx.reply(errorMsg);
      }
      return;
    }

    // Get product details
    const product = await ProductRepository.findProductById(order.productId);
    const productName = product ? product.name : 'Unknown Product';

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
    if (order.status === 'delivered') {
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
          } catch {
            orderDetails += `**Item ${index + 1}:** \`${item.trim()}\`\n\n`;
          }
        });
      } else {
        orderDetails += `\n💬 Your product details were delivered. Check your message history or contact support.`;
      }
    } else if (order.status === 'pending') {
      orderDetails += `\n⏳ **ORDER PENDING**\n`;
      orderDetails += ` Your order is being processed. Please wait for completion.`;
    } else if (order.status === 'paid') {
      orderDetails += `\n💰 **PAYMENT CONFIRMED**\n`;
      orderDetails += `� Processing your order. You'll receive your digital product soon!`;
    } else if (order.status === 'cancelled') {
      orderDetails += `\n❌ **ORDER CANCELLED**\n`;
      orderDetails += `� This order was cancelled and no product was delivered.`;
    }

    // Create back navigation keyboard
    const keyboard = new InlineKeyboard()
      .text('📋 Back to Orders', `orders_page_1`)
      .text('🏠 Main Menu', 'main_menu');

    if (ctx.callbackQuery) {
      await ctx.editMessageText(orderDetails, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(orderDetails, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    console.error('Error fetching order details:', error);
    const errorMsg =
      '❌ **ERROR LOADING ORDER**\n\nUnable to retrieve order details. Please try again.';

    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(errorMsg, { parse_mode: 'Markdown' });
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
  bot.command('orders', async ctx => {
    if (!ctx.from?.id) {
      await ctx.reply('❌ Unable to identify user.');
      return;
    }

    try {
      const userId = ctx.from.id.toString();
      await showOrdersPage(ctx, userId, 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      await ctx.reply('❌ Sorry, an error occurred while retrieving your orders.');
    }
  });

  // Handle order page navigation
  bot.callbackQuery(/^orders_page_(\d+)$/, async ctx => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery('❌ User not found');
      return;
    }

    try {
      const pageNumber = parseInt(ctx.match[1]);
      const userId = ctx.from.id.toString();

      await showOrdersPage(ctx, userId, pageNumber);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error('Error navigating orders:', error);
      await ctx.answerCallbackQuery('❌ Error loading orders. Please try again.');
    }
  });

  // Handle viewing a specific order
  bot.callbackQuery(/^order_(.+)$/, async ctx => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery('❌ User not found');
      return;
    }

    try {
      const orderId = ctx.match[1];
      await showOrderDetail(ctx, orderId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error('Error showing order details:', error);
      await ctx.answerCallbackQuery('❌ Error loading order details. Please try again.');
    }
  });
}
