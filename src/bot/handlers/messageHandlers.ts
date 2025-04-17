import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import KeyboardFactory from "../keyboards";

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  // Handle text messages
  bot.on("message:text", async (ctx) => {
    if (!ctx.from || !ctx.message || !("text" in ctx.message)) return;
    
    const text = ctx.message.text;
    
    // First verify user approval status from database to prevent session inconsistency
    if (text !== "yes" && text !== "no" && text.toLowerCase() !== "i agree" && text.toLowerCase() !== "i decline") {
      const user = await UserRepository.findUserByTelegramId(ctx.from.id);
      
      // If user exists and is approved, make sure the session step isn't "terms"
      if (user && user.isAccepted && ctx.session.step === "terms") {
        ctx.session.step = "approved";
        await ctx.reply("Your account is already approved. Use /products to start browsing.");
        return;
      }
    }
    
    // Handle terms acceptance
    if (ctx.session.step === "terms") {
      if (text.toLowerCase() === "yes" || text.toLowerCase() === "i agree") {
        // Create a new user with pending status
        const userData = {
          telegramId: ctx.from.id,
          username: ctx.from.username,
          isAccepted: false  // Start as pending
        };

        await UserRepository.createOrUpdateUser(userData);
        ctx.session.step = "pending";
        
        await ctx.reply(
          "✅ Thank you! Your registration has been received.\n\n" +
          "Please wait for admin approval. You'll receive a message when your account is approved."
        );
      } else if (text.toLowerCase() === "no" || text.toLowerCase() === "i decline") {
        await ctx.reply(
          "❌ You must accept the terms and conditions to use this service.\n\n" +
          "Use /start to try again when you're ready to accept."
        );
      } else {
        await ctx.reply("Please reply with 'Yes' to agree or 'No' to decline the terms.");
      }
      return;
    }
    
    // Default response for unexpected messages with helpful guidance
    await ctx.reply(
      "I'm not sure how to respond to that. Here are commands you can use:\n\n" +
      "/start - Main menu\n" +
      "/products - Browse our products\n" +
      "/orders - Check your orders\n" +
      "/help - Get help\n" +
      "/support - Contact our team"
    );
  });
  
  // Handle main menu button press
  bot.callbackQuery("main_menu", async (ctx) => {
    await ctx.editMessageText(
      "👋 Welcome to our Digital Store!\n\n" +
      "Use these commands to navigate:\n" +
      "/start - Main menu\n" +
      "/products - Browse products\n" +
      "/orders - View your orders\n" +
      "/support - Get help"
    );
    await ctx.answerCallbackQuery("Main menu displayed");
  });
  
  // Handle contact support button
  bot.callbackQuery("contact_support", async (ctx) => {
    await ctx.editMessageText(
      "📞 *Contact our Support Team*\n\n" +
      "You can reach our support team at:\n" +
      "• Telegram: @jeogo\n\n" +
      "Please include your order number if your question is about a specific order.",
      { 
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.backButton("main_menu", "Back to Main Menu")
      }
    );
    await ctx.answerCallbackQuery("Support information displayed");
  });
}
