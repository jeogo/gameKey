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

  // التسجيل الآن تلقائي، لا حاجة لأي تحقق قبول
  return next();
};
