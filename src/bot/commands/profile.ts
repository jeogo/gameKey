import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import * as OrderRepository from "../../repositories/OrderRepository";
import KeyboardFactory from "../keyboards";

/**
 * Display comprehensive user profile information
 */
async function showProfile(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Check if user exists and is approved
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply(
        "⚠️ Your account was not found. Please use /start to set up your account first."
      );
      return;
    }
    
    // Get comprehensive user stats
    const ordersResult = await OrderRepository.findOrdersByUserId(user._id!);
    const orders = ordersResult.orders;
    const orderCount = orders.length;
    
    // Calculate purchase statistics
    const completedOrders = orders.filter(order => order.status === 'delivered');
    const totalSpent = completedOrders.reduce((total, order) => total + (order.totalAmount || 0), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    // Calculate member duration
    const memberSince = new Date(user.createdAt);
    const daysSinceMember = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create comprehensive profile message
    const profileMessage = `� *YOUR PROFILE*\n\n` +
      `━━━ *Account Info* ━━━\n` +
      `📛 **Name:** ${ctx.from.first_name} ${ctx.from.last_name || ''}\n` +
      `🆔 **Username:** ${user.username || 'Not set'}\n` +
      `� **Member since:** ${memberSince.toLocaleDateString()} (${daysSinceMember} days)\n\n` +
      
      `━━━ *Purchase Statistics* ━━━\n` +
      `📜 **Total Orders:** ${orderCount}\n` +
      `✅ **Completed:** ${completedOrders.length}\n` +
      `⏳ **Pending:** ${pendingOrders.length}\n` +
      `💰 **Total Spent:** $${totalSpent.toFixed(2)}\n\n` +
      
      `━━━ *Recent Activity* ━━━\n` +
      `🕒 **Last Order:** ${orders.length > 0 ? new Date(orders[0].createdAt).toLocaleDateString() : 'None'}\n` +
      `📈 **Average per Order:** $${orderCount > 0 ? (totalSpent / completedOrders.length || 0).toFixed(2) : '0.00'}\n\n` +
      
      `*Use the menu buttons at the bottom to navigate!*`;
    
    // Simple text message without inline keyboard
    await ctx.reply(profileMessage, {
      parse_mode: "Markdown"
    });
    
  } catch (error) {
    console.error("Error showing profile:", error);
    await ctx.reply("Sorry, an error occurred while retrieving your profile information. Please try again later.");
  }
}

export { showProfile };

export function registerProfileCommand(bot: Bot<MyContext>): void {
  bot.command("profile", showProfile);
  
  // Refresh profile data
  bot.callbackQuery("refresh_profile", async (ctx) => {
    await showProfile(ctx);
    await ctx.answerCallbackQuery("Profile refreshed");
  });
  
  // Navigate to order history
  bot.callbackQuery("view_orders", async (ctx) => {
    // We'll use the orders command handler
    // This could be improved by making the orders command handler accessible here
    await ctx.editMessageText(
      "Redirecting to your orders...",
      { reply_markup: { inline_keyboard: [] } }
    );
    await ctx.answerCallbackQuery();
    await ctx.reply("/orders");
  });
}