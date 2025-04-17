import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";

export async function showHelpInfo(ctx: MyContext): Promise<void> {
  const helpText = `
*📋 Available Commands*

/start - Show welcome message & restart bot
/products - Browse our product catalog
/orders - View your order history
/support - Contact customer support

*🛍️ How to use the store:*
1. Use /products to browse categories
2. Select a product category
3. View product details
4. Track your order with /orders

Need assistance? Use /support to contact our team.
`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(helpText, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.support()
    });
  } else {
    await ctx.reply(helpText, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.support()
    });
  }
}

export function registerHelpCommand(bot: Bot<MyContext>): void {
  bot.command("help", async (ctx) => {
    await showHelpInfo(ctx);
  });
}
