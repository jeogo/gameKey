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
    
    // Enhanced help message with better organization
    const helpMessage = `GAMEKEY HELP CENTER\n\n` +
      `Digital gaming marketplace guide\n\n` +
      `SHOPPING COMMANDS\n` +
      `/shop - Browse our gaming catalog\n` +
      `/store - Same as /shop (alias)\n` +
      `/buy - Quick access to store\n\n` +
      `ACCOUNT COMMANDS\n` +
      `/orders - Your purchase history\n` +
      `/profile - Account information\n` +
      `/status - Account status\n\n` +
      `HOW TO PURCHASE\n` +
      `1. Type /shop to browse games\n` +
      `2. Choose your favorite title\n` +
      `3. Select crypto payment method\n` +
      `4. Receive instant delivery\n\n` +
      `PAYMENT METHODS\n` +
      `• USDT (Recommended)\n` +
      `• Bitcoin (BTC)\n` +
      `• Ethereum (ETH)\n` +
      `• Litecoin (LTC)\n\n` +
      `SUPPORT\n` +
      `Contact: @jeogo\n` +
      `Response time: Under 1 hour\n` +
      `Available: 24/7\n\n` +
      `Ready to start? Type /shop now!`;
    
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
