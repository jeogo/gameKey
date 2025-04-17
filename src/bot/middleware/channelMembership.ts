import { NextFunction } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Required channel information
 */
const REQUIRED_CHANNEL = {
  id: "@GameKeyChannel",
  title: "Game Key Channel",
  link: "https://t.me/GameKeyChannel"
};

/**
 * Middleware to check if a user is a member of the required channel
 */
export async function requireChannelMembership(ctx: MyContext, next: NextFunction): Promise<void> {
  // Always allow these specific callbacks
  if (ctx.callbackQuery?.data === "check_channel_membership" ||
      ctx.callbackQuery?.data === "accept_terms" ||
      ctx.callbackQuery?.data === "decline_terms" ||
      ctx.callbackQuery?.data === "check_status") {
    return next();
  }

  // Always allow /start and /help commands
  if (ctx.message?.text && ["/start", "/help"].includes(ctx.message.text.split(' ')[0])) {
    return next();
  }

  // Skip channel check for unregistered or pending users
  if (ctx.from?.id) {
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    // If user doesn't exist or is not accepted, skip channel check
    if (!user || !user.isAccepted) {
      return next();
    }
  } else {
    return next();
  }

  try {
    // Only check channel membership for approved users
    if (!ctx.from) {
      return next();
    }
    
    // Try to get channel member info
    const chatMember = await ctx.api.getChatMember(REQUIRED_CHANNEL.id, ctx.from.id).catch(() => null);
    
    // Check if user is a member of the channel
    if (chatMember && ["creator", "administrator", "member"].includes(chatMember.status)) {
      // User is a member, proceed with the bot
      return next();
    } else {
      // User is not a member, send a message to join the channel
      await ctx.reply(
        `🔔 *Welcome to our Bot!*\n\n` +
        `Before you can use this bot, you need to join our channel: *${REQUIRED_CHANNEL.title}*\n\n` +
        `After joining, click the "Check Membership" button below.`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📢 Join Channel", url: REQUIRED_CHANNEL.link }],
              [{ text: "✅ Check Membership", callback_data: "check_channel_membership" }]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error("Error checking channel membership:", error);
    // In case of error, allow the user to proceed to avoid blocking legitimate users
    return next();
  }
}
