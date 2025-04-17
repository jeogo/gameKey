import { Bot, MiddlewareFn } from "grammy";
import { MyContext } from "../types/session";

export const errorHandler: MiddlewareFn<MyContext> = async (ctx, next) => {
  try {
    // Timeout logic
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out")), 10000);
    });
    await Promise.race([next(), timeoutPromise]);
  } catch (error) {
    console.error("Error in middleware:", error);
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery("Sorry, an error occurred. Please try again.").catch(console.error);
    } else if (ctx.chat) {
      await ctx.reply("Sorry, an error occurred. Please try again.").catch(console.error);
    }
    throw error; // Let it bubble up if needed
  }
};
