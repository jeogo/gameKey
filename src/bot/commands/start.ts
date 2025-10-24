import { Bot } from 'grammy';
import { MyContext } from '../types/session';
import { removeKeyboard, createMainKeyboard } from '../keyboards/persistentKeyboard';
import * as UserRepository from '../../repositories/UserRepository';
import { formatMessage } from '../../config/botConfig';

/**
 * Handle /start command with username collection for new users
 */
async function startCommand(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;

    // Check if user exists
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);

    if (!user) {
      // New user - ask for username first
      ctx.session.step = 'waiting_username';

      await ctx.reply(formatMessage('WELCOME_NEW_USER'), {
        reply_markup: removeKeyboard(),
      });
      return;
    }

    // Existing user - show main interface
    await showMainInterface(ctx, user);
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('❌ Error occurred. Please try again.');
  }
}

/**
 * Show main interface for existing users
 */
async function showMainInterface(ctx: MyContext, user: any): Promise<void> {
  // Set session as approved for existing users
  ctx.session.step = 'approved';

  const username = user.username || ctx.from?.first_name || 'Gamer';

  // Send welcome message with reply keyboard
  await ctx.reply(formatMessage('WELCOME_EXISTING_USER', { username }), {
    reply_markup: createMainKeyboard(),
  });
}

export function registerStartCommand(bot: Bot<MyContext>): void {
  bot.command('start', startCommand);
}
