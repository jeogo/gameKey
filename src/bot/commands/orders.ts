import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import KeyboardFactory from "../keyboards";

// Export this function so it can be reused by callback handlers
export async function showOrdersPage(ctx: MyContext, userId: string, page: number): Promise<void> {
  const pageSize = 5; // 5 orders per page
  
  // Get paginated orders
  const result = await OrderRepository.findOrdersByUserId(userId, page, pageSize);
  
  if (result.orders.length === 0 && page === 1) {
    // No orders at all
    const message = "📭 *No Orders Found*\n\n" +
      "You don't have any orders yet.\n\n" +
      "Use /products to browse our catalog and make your first purchase.";
      
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { 
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.backToMain() 
      });
    } else {
      await ctx.reply(message, { 
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.backToMain() 
      });
    }
    return;
  }
  
  if (result.orders.length === 0 && page > 1) {
    // Trying to access a page that doesn't exist, go back to page 1
    return showOrdersPage(ctx, userId, 1);
  }
  
  // Introduction text explaining what orders are
  let ordersText = "📦 *YOUR ORDER HISTORY*\n\n";
  ordersText += "Here you can track your purchases and their status.\n";
  ordersText += "• ✅ Completed: Product has been delivered\n";
  ordersText += "• ⏳ Pending: Order is being processed\n";
  ordersText += "• ❌ Cancelled: Order has been cancelled\n\n";
  
  // Add orders info
  for (const order of result.orders) {
    const product = await ProductRepository.findProductById(order.productId);
    const productName = product ? product.name : "Unknown Product";
    
    const statusEmoji = {
      'pending': '⏳',
      'completed': '✅',
      'cancelled': '❌',
      'refunded': '↩️',
    }[order.status] || '⏳';
    
    ordersText += `${statusEmoji} *#${order._id?.slice(-6)}* · ${productName}\n`;
    ordersText += `$${order.totalAmount.toFixed(2)} · ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
  }
  
  // Pagination info
  const totalPages = Math.ceil(result.total / pageSize);
  ordersText += `Page ${page} of ${totalPages}`;

  const response = {
    parse_mode: "Markdown" as const,
    reply_markup: KeyboardFactory.ordersWithPagination(result.orders, page, totalPages)
  };
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(ordersText, response);
  } else {
    await ctx.reply(ordersText, response);
  }
}

/**
 * Show order details for a specific order
 */
export async function showOrderDetail(ctx: MyContext, orderId: string): Promise<void> {
  try {
    const order = await OrderRepository.findOrderById(orderId);
    
    if (!order || order.userId !== ctx.from?.id.toString()) {
      if (ctx.callbackQuery) {
        await ctx.editMessageText("Order not found or you don't have permission to view it.", {
          reply_markup: KeyboardFactory.backToMain()
        });
      } else {
        await ctx.reply("Order not found or you don't have permission to view it.", {
          reply_markup: KeyboardFactory.backToMain()
        });
      }
      return;
    }
    
    // Get product details
    const product = await ProductRepository.findProductById(order.productId);
    
    const statusEmoji = {
      'pending': '⏳',
      'completed': '✅',
      'cancelled': '❌',
      'refunded': '↩️',
    }[order.status] || '⏳';
    
    // Start building order details message
    let orderDetails = `
*Order #${order._id?.slice(-6)}*  ${statusEmoji}

*Product:* ${product?.name || 'Unknown Product'}
*Quantity:* ${order.quantity} × $${order.unitPrice.toFixed(2)}
*Total:* $${order.totalAmount.toFixed(2)}
*Date:* ${new Date(order.createdAt).toLocaleDateString()}
*Status:* ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
${order.customerNote ? `\n*Note:* ${order.customerNote}` : ''}
`;

    // Always try to retrieve and display digital content for completed orders
    if (order.status === "completed") {
      let digitalContentFound = false;
      
      // First, check in order history for stored content
      if (order.statusHistory) {
        // Look for content in any status history entry
        for (const entry of order.statusHistory) {
          if (entry.note && entry.note.includes("Content:")) {
            const match = entry.note.match(/Content: (.*)/);
            if (match && match[1]) {
              const contentItems = match[1].split(',');
              
              orderDetails += `\n🔐 *YOUR DIGITAL PRODUCT:*\n\n`;
              
              contentItems.forEach((item, index) => {
                try {
                  // Try to split into email:password format
                  const [email, password] = item.split(':');
                  orderDetails += `*Item ${index + 1}:*\n`;
                  orderDetails += `Email: \`${email}\`\n`;
                  orderDetails += `Password: \`${password}\`\n\n`;
                } catch (e) {
                  // Fallback if splitting fails
                  orderDetails += `*Item ${index + 1}:* \`${item}\`\n\n`;
                }
              });
              
              digitalContentFound = true;
              break;
            }
          }
        }
      }
      
      // If we couldn't find content in the order history, show a message
      if (!digitalContentFound) {
        orderDetails += "\nℹ️ Your product details were delivered when this order was completed.";
        orderDetails += "\nCheck your message history or contact support for assistance.";
      }
    } else if (order.status === "pending" && order.type === "preorder") {
      orderDetails += "\nℹ️ Your preorder is pending. You'll be notified when the product is available.";
    } else if (order.status === "cancelled") {
      orderDetails += "\nℹ️ This order was cancelled and no product was delivered.";
    }
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(orderDetails, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.orderDetails(order)
      });
    } else {
      await ctx.reply(orderDetails, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.orderDetails(order)
      });
    }
  } catch (error) {
    console.error("Error fetching order details:", error);
    const errorMsg = "Sorry, an error occurred while retrieving your order details.";
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg);
    } else {
      await ctx.reply(errorMsg);
    }
  }
}

export function registerOrdersCommand(bot: Bot<MyContext>): void {
  bot.command("orders", async (ctx) => {
    if (!ctx.from?.id) {
      await ctx.reply("Unable to identify user.");
      return;
    }

    try {
      // Get user's orders with pagination - start at page 1
      const userId = ctx.from.id.toString();
      await showOrdersPage(ctx, userId, 1);
    } catch (error) {
      console.error("Error fetching orders:", error);
      await ctx.reply("Sorry, an error occurred while retrieving your orders.");
    }
  });

  // Handle order page navigation
  bot.callbackQuery(/^orders_page_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const pageNumber = parseInt(ctx.match[1]);
      const userId = ctx.from.id.toString();
      
      await showOrdersPage(ctx, userId, pageNumber);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error navigating orders:", error);
      await ctx.answerCallbackQuery("Error loading orders. Please try again.");
    }
  });

  // Handle viewing a specific order
  bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const orderId = ctx.match[1];
      await showOrderDetail(ctx, orderId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing order details:", error);
      await ctx.answerCallbackQuery("Error loading order details. Please try again.");
    }
  });
}
