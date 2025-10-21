import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { removeKeyboard } from "../keyboards/persistentKeyboard";

export async function showSupportInfo(ctx: MyContext): Promise<void> {
  const supportText = `🆘 **GameKey Customer Support**\n\n` +
    `🌟 Need help? We're here for you 24/7!\n\n` +
    `━━━ **� CONTACT INFO** ━━━\n` +
    `�👨‍💻 **Support Team:** @jeogo\n` +
    `⚡ **Response Time:** Usually within 1-2 hours\n` +
    `🌍 **Availability:** 24/7 Support\n\n` +
    `━━━ **🛠️ WE HELP WITH** ━━━\n` +
    `🎮 Product recommendations & inquiries\n` +
    `📦 Order tracking & delivery issues\n` +
    `💳 Payment problems & refunds\n` +
    `🔧 Technical support & account help\n` +
    `🎯 How-to guides & tutorials\n\n` +
    `━━━ **📋 BEFORE CONTACTING** ━━━\n` +
    `✅ Your Telegram username: @${ctx.from?.username || 'your_username'}\n` +
    `✅ Order ID (if order-related)\n` +
    `✅ Clear description of the issue\n` +
    `✅ Screenshots (if helpful)\n\n` +
    `━━━ **🚀 QUICK ACTIONS** ━━━\n` +
    `💡 /help - Common questions & answers\n` +
    `📦 /orders - Check your order status\n` +
    `🛒 /shop - Browse our products\n` +
    `🏠 /menu - Return to main menu\n\n` +
    `Ready to get help? Contact @jeogo! 🎯`;
  
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
    "📞 **Contact Our Expert Support Team**\n\n" +
    "🎯 **Direct Contact:**\n" +
    "• 👨‍💻 Telegram: @jeogo\n" +
    "• ⚡ Response: Usually 1-2 hours\n" +
    "• 🌍 Available: 24/7\n\n" +
    "📋 **For Faster Support:**\n" +
    "• Mention your order number\n" +
    "• Include relevant screenshots\n" +
    "• Describe the issue clearly\n\n" +
    "� **Continue browsing with any command!**",
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