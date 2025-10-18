import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { removeKeyboard } from "../keyboards/persistentKeyboard";

export async function showSupportInfo(ctx: MyContext): Promise<void> {
  const supportText = `📞 *GameKey Support*\n\n` +
    `Need help? We're here for you!\n\n` +
    `👨‍💻 *Support Team:* @jeogo\n\n` +
    `🕐 *Available 24/7 for:*\n` +
    `• Product inquiries & recommendations\n` +
    `• Order issues & delivery problems\n` +
    `• Payment & technical support\n` +
    `• Account questions & assistance\n\n` +
    `💡 *When contacting support:*\n` +
    `• Include your Telegram username\n` +
    `• Mention your order ID (if applicable)\n` +
    `• Describe your issue clearly\n\n` +
    `🚀 *Quick Commands:*\n` +
    `/menu - Return to main menu\n` +
    `/products - Browse games\n` +
    `/orders - Check your orders\n` +
    `/help - View all commands`;
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(supportText, {
      parse_mode: "Markdown"
    });
  } else {
    await ctx.reply(supportText, {
      parse_mode: "Markdown",
      reply_markup: removeKeyboard()
    });
  }
}

export async function showContactInfo(ctx: MyContext): Promise<void> {
  await ctx.editMessageText(
    "📞 *Contact our Support Team*\n\n" +
    "You can reach our support team at:\n" +
    "• Telegram: @jeogo\n\n" +
    "Please include your order number if your question is about a specific order.\n\n" +
    "💡 Type any command to continue navigation.",
    { 
      parse_mode: "Markdown"
    }
  );
}

export function registerSupportCommand(bot: Bot<MyContext>): void {
  bot.command("support", async (ctx) => {
    await showSupportInfo(ctx);
  });
}