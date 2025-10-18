import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
import * as messages from "../utils/messages";
import { InlineKeyboard } from "grammy";

/**
 * Enhanced error recovery and user feedback service
 * Helps users recover from errors and provides helpful guidance
 */
export class UserFeedbackService {
  
  /**
   * Handle user errors gracefully with recovery options
   */
  static async handleError(ctx: MyContext, error: Error, context: string): Promise<void> {
    console.error(`Error in ${context}:`, error);
    
    let errorMessage = messages.createHeader("Oops! Something went wrong", "😅") + "\n";
    let recoveryOptions = KeyboardFactory.mainMenu();
    
    // Provide context-specific error messages and recovery
    switch (context) {
      case 'product_loading':
        errorMessage += "🛍️ We had trouble loading the products.\n\n" +
          "📋 *What you can do:*\n" +
          "• Try refreshing the product list\n" +
          "• Check your internet connection\n" +
          "• Return to main menu and try again\n\n";
        
        recoveryOptions = KeyboardFactory.confirmationDialog(
          "view_categories", 
          "main_menu"
        );
        break;
        
      case 'payment_processing':
        errorMessage += "💳 There was an issue processing your payment.\n\n" +
          "✅ *Don't worry - your money is safe!*\n\n" +
          "📋 *Next steps:*\n" +
          "• Check if payment completed on your end\n" +
          "• Try the payment process again\n" +
          "• Contact support for assistance\n\n";
        
        recoveryOptions = new InlineKeyboard()
          .text("🔄 Retry Payment", "retry_payment")
          .text("💬 Contact Support", "contact_support").row()
          .text("📦 Check Orders", "view_orders")
          .text("🏠 Main Menu", "main_menu");
        break;
        
      case 'order_retrieval':
        errorMessage += "📦 We couldn't load your order history right now.\n\n" +
          "📋 *Possible solutions:*\n" +
          "• Refresh your order list\n" +
          "• Check back in a few moments\n" +
          "• Contact support if issue persists\n\n";
        
        recoveryOptions = new InlineKeyboard()
          .text("🔄 Refresh Orders", "view_orders")
          .text("💬 Get Help", "contact_support").row()
          .text("🏠 Main Menu", "main_menu");
        break;
        
      default:
        errorMessage += "🤖 We encountered an unexpected issue.\n\n" +
          "📋 *How to proceed:*\n" +
          "• Return to main menu\n" +
          "• Try your action again\n" +
          "• Contact our support team if needed\n\n";
    }
    
    errorMessage += messages.createFooter();
    
    try {
      if (ctx.callbackQuery) {
        await ctx.editMessageText(errorMessage, {
          parse_mode: "Markdown",
          reply_markup: recoveryOptions
        });
        await ctx.answerCallbackQuery("⚠️ Error handled - recovery options provided");
      } else {
        await ctx.reply(errorMessage, {
          parse_mode: "Markdown", 
          reply_markup: recoveryOptions
        });
      }
    } catch (e) {
      // Fallback if even error handling fails
      console.error("Failed to send error message:", e);
      await ctx.reply("❌ An error occurred. Please try /start to restart the bot.");
    }
  }
  
  /**
   * Provide contextual help based on user's current state
   */
  static async provideContextualHelp(ctx: MyContext, currentAction: string): Promise<void> {
    let helpMessage = messages.createHeader("Need Help?", "💡") + "\n";
    let helpKeyboard = KeyboardFactory.helpMenu();
    
    switch (currentAction) {
      case 'browsing_products':
        helpMessage += "🛍️ *Browsing Products Help*\n\n" +
          "👀 *What you can do here:*\n" +
          "• Click on any category to see products\n" +
          "• Use search to find specific items\n" +
          "• Products marked ✅ are available now\n" +
          "• Products marked ⏰ are available for pre-order\n\n" +
          "💡 *Tip:* Look for 🔥 icons for featured products!\n";
        break;
        
      case 'making_purchase':
        helpMessage += "🛒 *Purchase Help*\n\n" +
          "📋 *Purchase process:*\n" +
          "1️⃣ Review product details carefully\n" +
          "2️⃣ Choose your preferred payment method\n" +
          "3️⃣ Complete payment securely\n" +
          "4️⃣ Receive your digital product instantly\n\n" +
          "🔒 *Security:* All payments are encrypted and secure\n";
        break;
        
      case 'viewing_orders':
        helpMessage += "📦 *Order Management Help*\n\n" +
          "👀 *Order status meanings:*\n" +
          "🟢 Completed - Your order is ready\n" +
          "🟡 Processing - We're preparing your order\n" +
          "🔴 Cancelled - Order was cancelled\n\n" +
          "💡 *Tip:* Click on any order to see full details\n";
        break;
        
      default:
        helpMessage += "🤖 *General Help*\n\n" +
          "🎯 *Quick actions:*\n" +
          "• Browse our product catalog\n" +
          "• Check your order history\n" +
          "• Update your profile\n" +
          "• Contact customer support\n\n" +
          "❓ Use the help menu for detailed guides\n";
    }
    
    helpMessage += messages.createFooter();
    
    await ctx.reply(helpMessage, {
      parse_mode: "Markdown",
      reply_markup: helpKeyboard
    });
  }
  
  /**
   * Collect user feedback about their experience
   */
  static async collectFeedback(ctx: MyContext, experienceType: string): Promise<void> {
    const feedbackMessage = messages.createHeader("We Value Your Feedback", "⭐") + "\n" +
      `How was your ${experienceType} experience?\n\n` +
      "Your feedback helps us improve GameKey Store!\n" +
      messages.createFooter();
    
    const feedbackKeyboard = new InlineKeyboard()
      .text("⭐⭐⭐⭐⭐ Excellent", `feedback_5_${experienceType}`)
      .text("⭐⭐⭐⭐ Good", `feedback_4_${experienceType}`).row()
      .text("⭐⭐⭐ Average", `feedback_3_${experienceType}`)
      .text("⭐⭐ Poor", `feedback_2_${experienceType}`).row()
      .text("⭐ Very Poor", `feedback_1_${experienceType}`)
      .text("💭 Add Comment", `feedback_comment_${experienceType}`).row()
      .text("⏭️ Skip", "main_menu");
    
    await ctx.reply(feedbackMessage, {
      parse_mode: "Markdown",
      reply_markup: feedbackKeyboard
    });
  }
  
  /**
   * Show loading message during long operations
   */
  static async showLoading(ctx: MyContext, operation: string): Promise<void> {
    const loadingMessages = [
      "🔄 Processing your request...",
      "⏳ Please wait while we load your data...",
      "🚀 Getting everything ready for you...",
      "🎯 Almost there...",
      "✨ Preparing your results..."
    ];
    
    const message = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    
    await ctx.reply(`${message}\n\n💡 *${operation}*`, {
      parse_mode: "Markdown"
    });
  }
  
  /**
   * Confirm user actions with clear descriptions
   */
  static async confirmAction(
    ctx: MyContext, 
    action: string, 
    description: string,
    confirmCallback: string,
    cancelCallback: string = "main_menu"
  ): Promise<void> {
    const confirmMessage = messages.createHeader("Please Confirm", "❓") + "\n" +
      `🎯 *Action:* ${action}\n\n` +
      `📋 *Description:*\n${description}\n\n` +
      `Are you sure you want to proceed?\n` +
      messages.createFooter();
    
    const confirmKeyboard = new InlineKeyboard()
      .text("✅ Yes, Continue", confirmCallback).row()
      .text("❌ No, Cancel", cancelCallback)
      .text("❓ More Info", `info_${action.toLowerCase().replace(/\s+/g, '_')}`);
    
    await ctx.editMessageText(confirmMessage, {
      parse_mode: "Markdown",
      reply_markup: confirmKeyboard
    });
  }
  
  /**
   * Show success message with next steps
   */
  static async showSuccess(ctx: MyContext, action: string, nextSteps?: string[]): Promise<void> {
    let successMessage = messages.createHeader("Success!", "🎉") + "\n" +
      `✅ ${action} completed successfully!\n\n`;
    
    if (nextSteps && nextSteps.length > 0) {
      successMessage += `🎯 *What's next?*\n`;
      nextSteps.forEach((step, index) => {
        successMessage += `${index + 1}️⃣ ${step}\n`;
      });
      successMessage += "\n";
    }
    
    successMessage += messages.createFooter();
    
    const successKeyboard = new InlineKeyboard()
      .text("🎊 Awesome!", "main_menu")
      .text("📦 View Orders", "view_orders").row()
      .text("🛍️ Shop More", "view_categories");
    
    await ctx.reply(successMessage, {
      parse_mode: "Markdown",
      reply_markup: successKeyboard
    });
  }
}

export default UserFeedbackService;