import { Bot } from 'grammy';
import { MyContext } from '../types/session';
import { createBackKeyboard } from '../keyboards/persistentKeyboard';
import { formatMessage } from '../../config/botConfig';

export async function showSupportInfo(ctx: MyContext): Promise<void> {
  const username = ctx.from?.username || ctx.from?.first_name || 'User';

  const supportText = formatMessage('SUPPORT_INFO', { username });

  if (ctx.callbackQuery) {
    await ctx.editMessageText(supportText);
  } else {
    await ctx.reply(supportText, {
      reply_markup: createBackKeyboard(),
    });
  }
}

export async function showContactInfo(ctx: MyContext): Promise<void> {
  await ctx.editMessageText(
    '📞 **Contact Our Expert Support Team**\n\n' +
      '🎯 **Direct Contact:**\n' +
      '• 👨‍💻 Telegram: @jeogo\n' +
      '• ⚡ Response: Usually 1-2 hours\n' +
      '• 🌍 Available: 24/7\n\n' +
      '📋 **For Faster Support:**\n' +
      '• Mention your order number\n' +
      '• Include relevant screenshots\n' +
      '• Describe the issue clearly\n\n' +
      '� **Continue browsing with any command!**',
    {
      parse_mode: 'Markdown',
    }
  );
}

export function registerSupportCommand(bot: Bot<MyContext>): void {
  bot.command('support', async ctx => {
    await showSupportInfo(ctx);
  });
}
