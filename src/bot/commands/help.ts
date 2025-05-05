import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
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
        "Welcome to GameKey! To use the bot, please use the /start command first and accept the terms."
      );
      return;
    }
    
    // Show full help information for users
    const helpMessage = `
📚 *Help Guide and Commands*

*Basic Commands:*
/start - Start using the bot
/menu - View main menu
/products - Browse products
/orders - View your previous orders
/support - Contact support

*GCoin Commands:*
/gcoin - View your GCoin balance
/buy_gcoins - Buy more GCoin
/transactions - View GCoin transaction history

*Referral Commands:*
/referrals - Manage your referral program

*How to use GCoin:*
• GCoin is an in-bot currency used for purchases.
• You can buy GCoin using cryptocurrencies.
• Exchange rate: 1$ = approximately 10 GCoin.

*Referral System:*
• Get 50 GCoin for each friend who registers using your referral link.
• Get an additional 100 GCoin when your friend makes their first purchase.

For direct assistance, use the /support command to contact our support team.
`;
    
    await ctx.reply(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.mainMenu()
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
