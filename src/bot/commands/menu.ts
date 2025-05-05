import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Display the main menu
 */
async function showMainMenu(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Check if user exists
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply(
        "Welcome to GameKey! To use the bot, please use the /start command first and accept the terms."
      );
      return;
    }
    
    // Format balance with thousands separator
    const formattedBalance = user.gcoinBalance.toLocaleString('en-US');
    
    const welcomeMessage = `
🎮 *Welcome to GameKey Store!*

💰 Your current balance: *${formattedBalance} GCoin*

Please select an option from the menu below:
`;
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(welcomeMessage, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.mainMenu()
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(welcomeMessage, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.mainMenu()
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
