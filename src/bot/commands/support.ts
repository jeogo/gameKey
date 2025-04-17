import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";

export async function showSupportInfo(ctx: MyContext): Promise<void> {
  const supportText = `
*📞 Need Help?*

For any questions or assistance, please contact our support team:

👨‍💻 *Support Team:* @jeogooussama

*Available 24/7 for:*
• Product inquiries
• Order issues
• Technical problems
• Account questions

You can also use these commands:
/help - Show all available commands
/orders - View your order history
/start - Return to main menu
`;
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(supportText, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.support()
    });
  } else {
    await ctx.reply(supportText, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.support()
    });
  }
}

export async function showContactInfo(ctx: MyContext): Promise<void> {
  await ctx.editMessageText(
    "📞 *Contact our Support Team*\n\n" +
    "You can reach our support team at:\n" +
    "• Telegram: @jeogooussama\n\n" +
    "Please include your order number if your question is about a specific order.",
    { 
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.backButton("main_menu", "Back to Main Menu")
    }
  );
}

export function registerSupportCommand(bot: Bot<MyContext>): void {
  bot.command("support", async (ctx) => {
    await showSupportInfo(ctx);
  });
}
