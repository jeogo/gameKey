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
    
    // Create enhanced profile message with better formatting
    const profileMessage = `👤 **YOUR GAMEKEY PROFILE**\n\n` +
      `━━━ **🎮 ACCOUNT INFO** ━━━\n` +
      `📛 **Name:** ${ctx.from.first_name} ${ctx.from.last_name || ''}\n` +
      `🆔 **Username:** ${user.username || 'Not set'}\n` +
      `📅 **Member since:** ${memberSince.toLocaleDateString()} (${daysSinceMember} days)\n` +
      `⭐ **Status:** ${completedOrders.length >= 10 ? 'VIP Customer' : completedOrders.length >= 5 ? 'Regular Customer' : 'New Customer'}\n\n` +
      
      `━━━ **📊 PURCHASE STATS** ━━━\n` +
      `📜 **Total Orders:** ${orderCount}\n` +
      `✅ **Completed:** ${completedOrders.length}\n` +
      `⏳ **Pending:** ${pendingOrders.length}\n` +
      `💰 **Total Spent:** $${totalSpent.toFixed(2)}\n` +
      `📈 **Average Order:** $${orderCount > 0 ? (totalSpent / completedOrders.length || 0).toFixed(2) : '0.00'}\n\n` +
      
      `━━━ **🕐 RECENT ACTIVITY** ━━━\n` +
      `🛒 **Last Order:** ${orders.length > 0 ? new Date(orders[0].createdAt).toLocaleDateString() : 'No orders yet'}\n` +
      `🎯 **Favorite Category:** ${completedOrders.length > 0 ? 'Gaming' : 'Not determined yet'}\n\n` +
      
      `━━━ **🏆 ACHIEVEMENTS** ━━━\n` +
      `${completedOrders.length > 0 ? '✅ First Purchase' : '⭕ First Purchase'}\n` +
      `${completedOrders.length >= 5 ? '✅ Regular Customer' : '⭕ Regular Customer (5 orders)'}\n` +
      `${totalSpent >= 100 ? '✅ VIP Member' : '⭕ VIP Member ($100+ spent)'}\n` +
      `${orderCount >= 10 ? '✅ Frequent Buyer' : '⭕ Frequent Buyer (10 orders)'}\n\n` +
      
      `━━━ **🎉 ACHIEVEMENTS** ━━━\n` +
      `${completedOrders.length >= 1 ? '🥉 First Purchase' : '⚪ First Purchase (locked)'}\n` +
      `${completedOrders.length >= 5 ? '🥈 Regular Shopper' : '⚪ Regular Shopper (locked)'}\n` +
      `${completedOrders.length >= 10 ? '🥇 VIP Customer' : '⚪ VIP Customer (locked)'}\n` +
      `${totalSpent >= 100 ? '💎 High Spender' : '⚪ High Spender (locked)'}\n\n` +
      
      `💡 **Ready for more games?** Type /shop to browse!`;
    
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