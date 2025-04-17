import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import { messages } from "../utils/messages";
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
      // Create a new user with pending status
      const userData = {
        telegramId: ctx.from.id,
        username: ctx.from.username,
        isAccepted: false
      };

      await UserRepository.createOrUpdateUser(userData);
      ctx.session.step = "pending";
      
      // Answer the callback query and update the message
      await ctx.answerCallbackQuery("Thank you for accepting the terms!");
      await ctx.editMessageText(
        "✅ Thank you for registering!\n\n" +
        "Your account is pending approval. We'll notify you when an admin reviews your registration.\n\n" +
        "Please wait for approval to access the store."
      );

      // Send a notification to all admins using NotificationService
      try {
        await NotificationService.sendUserRegistrationNotification({
          userId: ctx.from.id,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name
        });
      } catch (error) {
        console.error("Failed to send admin notification:", error);
      }

    } catch (error) {
      console.error("Error in registration:", error);
      await ctx.answerCallbackQuery("Error processing registration");
      await ctx.reply("An error occurred during registration. Please try again with /start");
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
    // Simulate /start command to show terms
    await ctx.editMessageText(messages.terms, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.terms()
    });
    await ctx.answerCallbackQuery();
  });
}
