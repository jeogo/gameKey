import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { removeKeyboard } from "../keyboards/persistentKeyboard";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Display help information
 */
async function helpCommand(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Check if user exists
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply(
        "Welcome to GameKey! To use the bot, please use the /start command first."
      );
      return;
    }
    
    // Clean help message with commands
    const helpMessage = `💬 *GameKey Help & Commands*\n\n` +
      `🎮 *Available Commands:*\n\n` +
      `🛍️ /products - Browse our gaming catalog\n` +
      `📜 /orders - View your purchase history\n` +
      `👤 /profile - Your account & statistics\n` +
      `🏠 /menu - Return to main menu\n` +
      `📞 /support - Contact customer support\n\n` +
      `🔥 *How to purchase:*\n` +
      `1. Type /products to browse\n` +
      `2. Choose a game you want\n` +
      `3. Complete secure crypto payment\n` +
      `4. Get instant delivery!\n\n` +
      `💎 *Payment Methods:*\n` +
      `• Bitcoin (BTC)\n` +
      `• Ethereum (ETH)\n` +
      `• USDT (Tether)\n` +
      `• Litecoin (LTC)\n\n` +
      `📞 *Need help?* Contact @jeogo\n\n` +
      `💡 *Just type any command to get started!*`;
    
    await ctx.reply(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard()
    });
    
  } catch (error) {
    console.error("Error in help command:", error);
    await ctx.reply("Sorry, an error occurred while processing your request. Please try again later.");
  }
}

export function registerHelpCommand(bot: Bot<MyContext>): void {
  bot.command("help", helpCommand);
  
  // Also register an alias for help
  bot.command("commands", helpCommand);
}
