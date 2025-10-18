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
      
      const welcomeMessage = `🎮 *Welcome to GameKey Store!*\n\n` +
        `👋 Hi there! We're excited to have you!\n\n` +
        `📝 To get started, please tell me:\n` +
        `**What username would you like to use?**\n\n` +
        `💡 *Just type your preferred username below*`;
      
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
  
  // Clean welcome message without keyboard
  const welcomeMessage = `🎮 *GameKey Store*\n\n` +
    `👋 Welcome back ${username}!\n\n` +
    `🛍️ Digital games with instant delivery\n` +
    `💳 Secure payments • 📞 24/7 support\n\n` +
    `*Available Commands:*\n` +
    `/menu - Show main menu\n` +
    `/products - Browse products\n` +
    `/orders - View your orders\n` +
    `/profile - View your profile\n` +
    `/help - Get help\n` +
    `/support - Contact support`;
  
  // Send welcome message with removed keyboard
  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: removeKeyboard()
  });
}

export function registerStartCommand(bot: Bot<MyContext>): void {
  bot.command("start", startCommand);
}