import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message?.text;
    if (!text) return;
    
    // Handle username collection for new users
    if (ctx.session.step === "waiting_username") {
      await handleUsernameInput(ctx, text);
      return;
    }
    
    // For any other text message, show help with available commands
    const helpMessage = `🎮 *GameKey Store*\n\n` +
      `Please use these commands:\n\n` +
      `/start - Start/restart the bot\n` +
      `/menu - Show main menu\n` +
      `/products - Browse products\n` +
      `/orders - View your orders\n` +
      `/profile - View your profile\n` +
      `/help - Get help\n` +
      `/support - Contact support\n\n` +
      `📞 Need help? Contact @jeogo`;
    
    await ctx.reply(helpMessage, {
      parse_mode: "Markdown"
    });
  });
}

/**
 * Handle username input from new users
 */
async function handleUsernameInput(ctx: MyContext, username: string): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Validate username
    if (username.length < 2 || username.length > 20) {
      await ctx.reply(
        "❌ Username must be between 2-20 characters.\n\n" +
        "Please try again:"
      );
      return;
    }
    
    // Create user with the provided username
    const user = await UserRepository.createOrUpdateUser({
      telegramId: ctx.from.id,
      username: username.trim()
    });
    
    // Set session as approved
    ctx.session.step = "approved";
    
    // Show success message
    const successMessage = `✅ *Perfect!*\n\n` +
      `👋 Welcome ${username}!\n\n` +
      `🎮 Your account is ready!\n` +
      `Type /menu to see available commands!`;
    
    await ctx.reply(successMessage, {
      parse_mode: "Markdown"
    });
    
  } catch (error) {
    console.error("Error handling username input:", error);
    await ctx.reply("❌ Error saving username. Please try again.");
  }
}