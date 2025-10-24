import { Bot } from 'grammy';
import { MyContext } from '../types/session';
import * as UserRepository from '../../repositories/UserRepository';
import { showCategories } from '../commands/products';
import { showOrdersPage } from '../commands/orders';
import { showProfile } from '../commands/profile';
import { showSupportInfo } from '../commands/support';
import { createMainKeyboard } from '../keyboards/persistentKeyboard';
import { BOT_CONFIG, formatMessage } from '../../config/botConfig';

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  bot.on('message:text', async ctx => {
    const text = ctx.message?.text;
    if (!text) return;

    // Handle username collection for new users
    if (ctx.session.step === 'waiting_username') {
      await handleUsernameInput(ctx, text);
      return;
    }

    // Handle reply keyboard button presses
    await handleButtonPress(ctx, text);
  });
}

/**
 * Handle reply keyboard button presses
 */
async function handleButtonPress(ctx: MyContext, buttonText: string): Promise<void> {
  if (!ctx.from) return;

  // Check if user exists
  const user = await UserRepository.findUserByTelegramId(ctx.from.id);
  if (!user) {
    await ctx.reply('Please use /start to set up your account first.');
    return;
  }

  // Handle button presses
  switch (buttonText) {
    case BOT_CONFIG.BUTTONS.SHOP:
      await showCategories(ctx);
      break;

    case BOT_CONFIG.BUTTONS.ORDERS:
      await showOrdersPage(ctx, user._id?.toString() || '');
      break;

    case BOT_CONFIG.BUTTONS.PROFILE:
      await showProfile(ctx);
      break;

    case BOT_CONFIG.BUTTONS.SUPPORT:
      await showSupportInfo(ctx);
      break;

    case BOT_CONFIG.BUTTONS.BACK_TO_MENU:
      await showMainMenuCommand(ctx);
      break;

    default:
      // Unknown button - show navigation help
      await ctx.reply(formatMessage('UNKNOWN_COMMAND'), { reply_markup: createMainKeyboard() });
      break;
  }
}

/**
 * Handle username input from new users
 */
async function handleUsernameInput(ctx: MyContext, username: string): Promise<void> {
  try {
    if (!ctx.from) return;

    // Validate username
    if (
      username.length < BOT_CONFIG.SETTINGS.USERNAME_MIN_LENGTH ||
      username.length > BOT_CONFIG.SETTINGS.USERNAME_MAX_LENGTH
    ) {
      await ctx.reply(formatMessage('ERROR_USERNAME_LENGTH'));
      return;
    }

    // Create user with the provided username
    await UserRepository.createOrUpdateUser({
      telegramId: ctx.from.id,
      username: username.trim(),
    });

    // Set session as approved
    ctx.session.step = 'approved';

    // Show success message
    await ctx.reply(formatMessage('USERNAME_SUCCESS', { username }), {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error('Error handling username input:', error);
    await ctx.reply('❌ Error saving username. Please try again.');
  }
}

/**
 * Show main menu
 */
async function showMainMenuCommand(ctx: MyContext): Promise<void> {
  if (!ctx.from) return;

  const user = await UserRepository.findUserByTelegramId(ctx.from.id);
  const username = user?.username || ctx.from.first_name || 'User';

  await ctx.reply(formatMessage('WELCOME_EXISTING_USER', { username }), {
    reply_markup: createMainKeyboard(),
  });
}
