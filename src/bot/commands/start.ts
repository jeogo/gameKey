import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { removeKeyboard } from "../keyboards/persistentKeyboard";
import * as UserRepository from "../../repositories/UserRepository";
import { isAdmin } from "../../utils/adminUtils";

/**
 * Handle /start command with username collection for new users
 */
async function startCommand(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Check if user exists
    let user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      // New user - ask for username first
      ctx.session.step = "waiting_username";
      
      const welcomeMessage = `WELCOME TO GAMEKEY STORE\n\n` +
        `Digital Gaming Marketplace\n\n` +
        `Welcome! We need to set up your account.\n\n` +
        `Setup Required:\n` +
        `Please provide a username for your account.\n\n` +
        `What username would you like to use?\n\n` +
        `Type your preferred username below\n` +
        `Example: GamerPro2024, YourName, etc.\n\n` +
        `This will only take a moment.`;
      
      await ctx.reply(welcomeMessage, {
        parse_mode: "Markdown"
      });
      return;
    }
    
    // Existing user - show main interface
    await showMainInterface(ctx, user);
    
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("❌ Error occurred. Please try again.");
  }
}

/**
 * Show main interface for existing users
 */
async function showMainInterface(ctx: MyContext, user: any): Promise<void> {
  // Set session as approved for existing users
  ctx.session.step = "approved";
  
  const username = user.username || ctx.from?.first_name || "Gamer";
  
  // Enhanced welcome message for returning users
  const welcomeMessage = `🎮 **GAMEKEY STORE**\n\n` +
    `👋 **Welcome back, ${username}!**\n\n` +
    `🛍️ *Premium digital games with instant delivery*\n` +
    `💳 *Secure crypto payments • 📞 24/7 support*\n\n` +
    `🚀 **QUICK ACTIONS:**\n` +
    `🛒 /shop - Browse our game collection\n` +
    `📦 /orders - View your purchases\n` +
    `👤 /profile - Check your account\n` +
    `❓ /help - Get help & support\n` +
    `📊 /status - System status\n\n` +
    `💎 **Ready to find your next favorite game?**\n` +
    `*Type /shop to start browsing!*`;
  
  // Send enhanced welcome message
  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: removeKeyboard()
  });
}

export function registerStartCommand(bot: Bot<MyContext>): void {
  bot.command("start", startCommand);
}