import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Show user status and recent activity
 */
export async function showStatus(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply("❌ User not found. Please use /start first.");
      return;
    }

    // Get recent orders
    const userId = user._id?.toString();
    if (!userId) {
      await ctx.reply("❌ Invalid user data. Please contact support.");
      return;
    }

    const recentOrders = await OrderRepository.findOrdersByUserId(userId, 1, 3);
    const pendingOrders = recentOrders.orders.filter(order => order.status === 'pending');
    const completedOrders = recentOrders.orders.filter(order => order.status === 'delivered');

    const statusMessage = `📊 **Your GameKey Status**\n\n` +
      `👤 **Account:** Active since ${new Date(user.createdAt).toLocaleDateString()}\n` +
      `🆔 **User ID:** ${userId.slice(-8)}\n\n` +
      
      `━━━ **📦 ORDER STATUS** ━━━\n` +
      `⏳ **Pending Orders:** ${pendingOrders.length}\n` +
      `✅ **Recent Completed:** ${completedOrders.length}\n` +
      `📈 **Total Orders:** ${recentOrders.total}\n\n` +
      
      `━━━ **🔄 RECENT ACTIVITY** ━━━\n` +
      (recentOrders.orders.length > 0 ? 
        recentOrders.orders.slice(0, 3).map(order => 
          `${order.status === 'pending' ? '⏳' : order.status === 'delivered' ? '✅' : '📦'} Order #${order._id?.toString().slice(-6) || 'N/A'} - ${order.status.toUpperCase()}`
        ).join('\n') + '\n\n' :
        `📭 No recent orders found\n\n`
      ) +
      
      `━━━ **🚀 QUICK ACTIONS** ━━━\n` +
      `🛒 /shop - Browse products\n` +
      `📦 /orders - View all orders\n` +
      `👤 /profile - Account details\n` +
      `🆘 /support - Get help\n\n` +
      
      `Everything looks good! Happy gaming! 🎮`;

    await ctx.reply(statusMessage, { parse_mode: "Markdown" });

  } catch (error) {
    console.error("Error showing status:", error);
    await ctx.reply("❌ Sorry, couldn't load your status. Please try again later.");
  }
}

/**
 * Register the status command
 */
export function registerStatusCommand(bot: Bot<MyContext>): void {
  bot.command("status", showStatus);
}