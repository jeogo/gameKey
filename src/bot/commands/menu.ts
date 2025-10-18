import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { removeKeyboard } from "../keyboards/persistentKeyboard";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Display the main menu with clean command interface
 */
async function showMainMenu(ctx: MyContext): Promise<void> {
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
    
    const username = ctx.from.first_name || ctx.from.username || "Gamer";
    
    const menuMessage = `🎮 *GameKey Store - Main Menu*\n\n` +
      `👋 Hello ${username}!\n\n` +
      `🏪 *Available Commands:*\n\n` +
      `🛍️ /products - Browse our game collection\n` +
      `📜 /orders - View your purchase history\n` +
      `� /profile - Check your account details\n` +
      `💬 /help - Get help and information\n` +
      `📞 /support - Contact customer support\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *Simply type any command to get started!*`;
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(menuMessage, {
        parse_mode: "Markdown"
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(menuMessage, {
        parse_mode: "Markdown",
        reply_markup: removeKeyboard()
      });
    }
    
  } catch (error) {
    console.error("Error showing main menu:", error);
    await ctx.reply("Sorry, an error occurred. Please try again later.");
  }
}

export function registerMenuCommand(bot: Bot<MyContext>): void {
  bot.command("menu", showMainMenu);
  bot.callbackQuery("main_menu", async (ctx) => {
    await showMainMenu(ctx);
    await ctx.answerCallbackQuery();
  });
}
