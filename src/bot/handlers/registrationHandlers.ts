import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import KeyboardFactory from "../keyboards";
import { NotificationService } from "../services/NotificationService";

export function registerRegistrationHandlers(bot: Bot<MyContext>): void {
  // Handle terms acceptance
  bot.callbackQuery("accept_terms", async (ctx) => {
    if (!ctx.from) {
      await ctx.answerCallbackQuery("Unable to identify user");
      return;
    }

    try {
      // Create a new user and allow access immediately
      const userData = {
        telegramId: ctx.from.id,
        username: ctx.from.username
      };

      await UserRepository.createOrUpdateUser(userData);
      ctx.session.step = "approved";
      
      // Answer the callback query and update the message
      await ctx.answerCallbackQuery("تم تسجيلك بنجاح!");
      await ctx.editMessageText(
        "✅ تم تسجيلك بنجاح! يمكنك الآن استخدام جميع ميزات البوت مباشرة.\n\nاستخدم القائمة الرئيسية للبدء."
      );
    } catch (error) {
      console.error("Error in registration:", error);
      await ctx.answerCallbackQuery("Error processing registration");
      await ctx.reply("حدث خطأ أثناء التسجيل. حاول مرة أخرى باستخدام /start");
    }
  });

  // Handle terms decline
  bot.callbackQuery("decline_terms", async (ctx) => {
    await ctx.answerCallbackQuery("You must accept the terms to use the service");
    await ctx.editMessageText(
      "❌ You have declined the terms and conditions.\n\n" +
      "You must accept the terms to use our service. Use /start if you change your mind."
    );
  });

  // Check registration status - refactored to avoid duplication with callbackHandlers.ts
  bot.callbackQuery("check_status", async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");

    try {
      // Forward to the handler in callbackHandlers.ts by triggering the same event
      // This avoids duplicating the logic and ensures consistent behavior
      await ctx.api.answerCallbackQuery(ctx.callbackQuery.id);
      
      // Re-emit the same callback to be handled by the other handler
      await bot.handleUpdate({
        update_id: 0,
        callback_query: {
          id: ctx.callbackQuery.id,
          from: ctx.from,
          chat_instance: ctx.callbackQuery.chat_instance,
          data: "check_status"
        }
      });
    } catch (error) {
      console.error("Error forwarding check_status in registrationHandlers:", error);
      await ctx.answerCallbackQuery("Error checking status. Please try again.");
    }
  });

  // Register command shortcut
  bot.callbackQuery("register", async (ctx) => {
    // عرض نص الشروط مباشرة بدل استخدام messages.terms
    await ctx.editMessageText(
      "*الشروط والأحكام*\n\nاستخدامك لهذا البوت يعني موافقتك على الشروط.\n\nاضغط موافق للاستمرار.",
      {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.terms()
      }
    );
    await ctx.answerCallbackQuery();
  });
}
