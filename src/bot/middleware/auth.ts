import { Bot } from "grammy";
import { MiddlewareFn } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import { isAdmin } from "../../utils/adminUtils";

/**
 * Middleware to check if a user is approved
 * before allowing them to use the bot's full functionality
 */
export const authMiddleware: MiddlewareFn<MyContext> = async (ctx, next) => {
  // Get user ID from context
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("Unable to identify user. Please restart the conversation with /start");
    return;
  }
  
  // Check if user is an admin, always allow admins
  if (isAdmin(userId)) {
    return next();
  }
  
  // Allow only these specific commands for non-approved users
  const allowedCommands = ["/start", "/help"];
  const allowedCallbacks = ["accept_terms", "decline_terms", "check_status", "check_channel_membership"];
  
  // Check if the incoming action is allowed
  let isAllowed = false;
  
  // Check command messages
  if (ctx.message?.text && allowedCommands.includes(ctx.message.text.split(' ')[0])) {
    isAllowed = true;
  }
  
  // Check callback queries
  if (ctx.callbackQuery?.data) {
    // Allow callbacks that start with these prefixes
    isAllowed = allowedCallbacks.some(prefix => 
      ctx.callbackQuery?.data === prefix || 
      (ctx.callbackQuery?.data && ctx.callbackQuery.data.startsWith(`${prefix}_`))
    );
  }
  
  // If allowed command/callback, continue to check user registration state
  if (isAllowed) {
    // Check if user exists and is approved
    const user = await UserRepository.findUserByTelegramId(userId);
    
    // If user doesn't exist or is in pending state, let them proceed with limited commands
    if (!user || !user.isAccepted) {
      return next();
    }
    
    // User is approved, update session if needed
    if (ctx.session.step === "terms" || ctx.session.step === "pending") {
      ctx.session.step = "approved";
    }
    
    return next();
  }
  
  // Check user status for all other commands/callbacks
  const user = await UserRepository.findUserByTelegramId(userId);
  
  if (!user) {
    // Unregistered user
    await ctx.reply(
      "You need to register first. Please use /start to begin the registration process."
    );
    return;
  }
  
  if (!user.isAccepted) {
    // Calculate time since registration
    const waitingTime = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60));
    
    // User exists but is not approved
    await ctx.reply(
      `Your account is still pending approval. You've been waiting for about ${waitingTime} hour(s).\n\nPlease wait for an admin to approve your registration.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 Check Status", callback_data: "check_status" }]
          ]
        }
      }
    );
    return;
  }
  
  // User is approved, proceed
  return next();
};
