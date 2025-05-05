import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import KeyboardFactory from "../keyboards";
import * as messages from "../utils/messages";
import { initiateBuyGcoin } from "../commands/gcoin";

/**
 * Handle user's message based on current conversation step
 */
async function handleConversationStep(ctx: MyContext): Promise<boolean> {
  // Check if we have an active conversation step
  if (!ctx.session?.step) return false;
  
  // The text message sent by the user
  const text = ctx.message?.text;
  if (!text) return false;
  
  // Handle different conversation steps
  switch (ctx.session.step) {
    case "support":
      // Handle support message
      await ctx.reply(messages.SUPPORT_REQUEST_RECEIVED);
      // Send to support chat or admin
      // TODO: implement support forwarding
      
      // Reset conversation step
      ctx.session.step = undefined;
      return true;

    case "buy_gcoin_custom":
      // Handle custom GCoin amount purchase
      // Parse the amount
      const amount = parseInt(text);
      if (!isNaN(amount) && amount > 0) {
        await initiateBuyGcoin(ctx, amount);
      } else {
        await ctx.reply("Please enter a valid positive number.");
      }
      
      // Reset conversation step
      ctx.session.step = undefined;
      return true;
      
    default:
      return false;
  }
}

export function registerMessageHandlers(bot: Bot<MyContext>): void {
  // Handle text messages based on conversation state
  bot.on("message:text", async (ctx, next) => {
    const handled = await handleConversationStep(ctx);
    
    // If not handled by conversation, continue to next handler
    if (!handled) {
      if (!ctx.from || !ctx.message || !("text" in ctx.message)) return;
      
      const text = ctx.message.text;
      
      // Handle terms acceptance
      if (ctx.session.step === "terms") {
        if (text.toLowerCase() === "yes" || text.toLowerCase() === "i agree") {
          // Create a new user with pending status
          const userData = {
            telegramId: ctx.from.id,
            username: ctx.from.username
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
    }
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
