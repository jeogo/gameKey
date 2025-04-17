import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as UserRepository from "../../repositories/UserRepository";
import * as PaymentRepository from "../../repositories/PaymentRepository";
import * as PaymentController from "../../controllers/PaymentController";
import KeyboardFactory from "../keyboards";
import { messages } from "../utils/messages";
import { bot } from "../../bot";
import { PurchaseService } from "../services/PurchaseService";
import { isAdmin } from "../../utils/adminUtils";

// Import command implementations
import { showOrdersPage, showOrderDetail } from "../commands/orders";
import { showCategories, showProductsInCategory, showProductDetails, purchaseProduct } from "../commands/products";
import { sendTermsAndConditions, sendWelcomeMessage } from "../commands/start";
import { showHelpInfo } from "../commands/help";
import { showSupportInfo, showContactInfo } from "../commands/support";

/**
 * Register all callback handlers for the bot
 */
export function registerCallbackHandlers(bot: Bot<MyContext>): void {
  // =====================================
  // Category and Product Related Callbacks
  // =====================================
  
  // Handle category selection
  bot.callbackQuery(/^category_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const categoryId = ctx.match[1];
      await showProductsInCategory(ctx, categoryId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing products:", error);
      await ctx.answerCallbackQuery("Error loading products. Please try again.");
    }
  });
  
  // Handle product selection
  bot.callbackQuery(/^product_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const productId = ctx.match[1];
      await showProductDetails(ctx, productId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing product details:", error);
      await ctx.answerCallbackQuery("Error loading product details. Please try again.");
    }
  });
  
  // Handle back to categories button
  bot.callbackQuery("view_categories", async (ctx) => {
    await showCategories(ctx);
    await ctx.answerCallbackQuery();
  });
  
  // Handle pagination for products
  bot.callbackQuery(/^next_products_(.+)_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const categoryId = ctx.match[1];
      const offset = parseInt(ctx.match[2]);
      await showProductsInCategory(ctx, categoryId, offset);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error loading more products:", error);
      await ctx.answerCallbackQuery("Error loading more products. Please try again.");
    }
  });

  // Handle purchase button - show confirmation first
  bot.callbackQuery(/^purchase_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const productId = ctx.match[1];
      // Instead of direct purchase, request confirmation first
      await PurchaseService.requestPurchaseConfirmation(ctx, productId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error processing purchase:", error);
      await ctx.answerCallbackQuery("Error preparing your purchase. Please try again.");
    }
  });

  // Handle confirm purchase
  bot.callbackQuery(/^confirm_purchase_(.+)_(\d+)$/, async (ctx) => {
    const productId = ctx.match[1];
    const quantity = parseInt(ctx.match[2], 10);

    await ctx.answerCallbackQuery();
    await PurchaseService.initiateProductPurchase(ctx, productId, quantity);
  });

  // Handle cancel purchase
  bot.callbackQuery("cancel_purchase", async (ctx) => {
    await ctx.answerCallbackQuery("Purchase canceled.");
    await ctx.reply("No worries. Purchase canceled.");
  });

  // Handle payment status check
  bot.callbackQuery(/^check_payment_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const transactionId = ctx.match[1];
      
      // Show checking message
      await ctx.answerCallbackQuery("Checking payment status...");
      
      // Get transaction status
      const transaction = await PaymentRepository.findTransactionById(transactionId);
      if (!transaction) {
        return await ctx.reply("Transaction not found. Please contact support.");
      }
      
      // Check with payment processor for latest status
      const updatedTx = await PaymentController.checkPaymentStatus(transactionId);
      
      if (updatedTx?.status === "completed") {
        await ctx.reply(
          "✅ *Payment Successful!*\n\n" +
          "Your payment has been confirmed and your order is now processing.\n\n" +
          "Your digital items will be delivered shortly.",
          { parse_mode: "Markdown", reply_markup: KeyboardFactory.backToMain() }
        );
      } else if (updatedTx?.status === "pending") {
        await ctx.reply(
          "⏳ *Payment Pending*\n\n" +
          "We haven't received confirmation of your payment yet.\n\n" +
          "Please complete the payment process or try again later.",
          { 
            parse_mode: "Markdown", 
            reply_markup: KeyboardFactory.paymentLink(updatedTx.paymentUrl!, transactionId)
          }
        );
      } else {
        await ctx.reply(
          "❌ *Payment Issue*\n\n" +
          "There seems to be an issue with your payment.\n\n" +
          "Please try again or contact support for assistance.",
          { parse_mode: "Markdown", reply_markup: KeyboardFactory.backToMain() }
        );
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      await ctx.reply("Error checking payment status. Please try again later.");
    }
  });

  // Handle payment support
  bot.callbackQuery("payment_support", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "🛠 *Payment Support*\n\n" +
      "If you're experiencing any issues with your payment, please:\n\n" +
      "1️⃣ Make sure you completed the payment process\n" +
      "2️⃣ Try refreshing the payment page\n" +
      "3️⃣ Contact our support team with your order details\n\n" +
      "👨‍💻 Support: @jeogo",
      { parse_mode: "Markdown", reply_markup: KeyboardFactory.backToMain() }
    );
  });

  // =====================================
  // Order Related Callbacks
  // =====================================
  
  // Handle order details view
  bot.callbackQuery(/^order_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const orderId = ctx.match[1];
      await showOrderDetail(ctx, orderId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing order details:", error);
      await ctx.answerCallbackQuery("Error loading order details. Please try again.");
    }
  });
  
  // Handle order support request
  bot.callbackQuery(/^support_order_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const orderId = ctx.match[1];
      await ctx.editMessageText(
        `📞 *Support Request for Order #${orderId.slice(-6)}*\n\n` +
        "Please contact our support team with this order number for assistance:\n\n" +
        "👨‍💻 Support: @jeogo",
        { 
          parse_mode: "Markdown",
          reply_markup: KeyboardFactory.backButton(`order_${orderId}`, "Back to Order Details")
        }
      );
      await ctx.answerCallbackQuery("Support information displayed");
    } catch (error) {
      console.error("Error showing order support:", error);
      await ctx.answerCallbackQuery("Error processing your request. Please try again.");
    }
  });

  // Handle going back to orders
  bot.callbackQuery("my_orders", async (ctx) => {
    if (!ctx.from?.id) {
      await ctx.reply("Unable to identify user.");
      return;
    }

    try {
      // Use the same function but always start at page 1
      const userId = ctx.from.id.toString();
      await showOrdersPage(ctx, userId, 1);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error fetching orders:", error);
      await ctx.editMessageText("Sorry, an error occurred while retrieving your orders.");
    }
  });

  // Handle orders page navigation
  bot.callbackQuery(/^orders_page_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const pageNumber = parseInt(ctx.match[1]);
      const userId = ctx.from.id.toString();
      await showOrdersPage(ctx, userId, pageNumber);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error navigating orders:", error);
      await ctx.answerCallbackQuery("Error loading orders. Please try again.");
    }
  });
  
  // Placeholder for current page info button
  bot.callbackQuery("current_page_info", async (ctx) => {
    await ctx.answerCallbackQuery("Current page indicator");
  });

  // =====================================
  // Registration & User Related Callbacks
  // =====================================
  
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

      // Send a notification to admin
      try {
        const adminIds = process.env.ADMIN_IDS?.split(",").map(id => parseInt(id.trim(), 10)) || [];
        for (const adminId of adminIds) {
          if (adminId !== 0) {
            await bot.api.sendMessage(
              adminId,
              `A new user has registered:\nUsername: @${ctx.from.username || "NoUsername"}\nID: ${ctx.from.id}`,
              { reply_markup: KeyboardFactory.adminApproval(ctx.from.id) }
            );
          }
        }
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

  // Handle registration status check
  bot.callbackQuery("check_status", async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");

    try {
      const user = await UserRepository.findUserByTelegramId(ctx.from.id);

      if (!user) {
        await ctx.editMessageText("You don't have a registration in our system. Use /start to register.", {
          reply_markup: KeyboardFactory.register()
        });
        return await ctx.answerCallbackQuery();
      }

      if (user.isAccepted) {
        // User was approved - different message from pending
        await ctx.editMessageText(
          "✅ Your account has been approved! You can now use all features of the bot.",
          { parse_mode: "Markdown" }
        );
        ctx.session.step = "approved";
        return await ctx.answerCallbackQuery("Account approved! ✅");
      } else {
        // Still pending - add current time to force text change
        const currentTime = new Date().toLocaleTimeString();
        await ctx.editMessageText(
          `Your account is still pending approval. We'll notify you when an admin reviews your registration.\n\nLast checked: ${currentTime}`,
          { reply_markup: new InlineKeyboard().text("🔍 Check Again", "check_status") }
        );
        return await ctx.answerCallbackQuery("Still pending approval. Please wait.");
      }
    } catch (error) {
      console.error("Error in check_status handler:", error);
      // If an error occurs, still provide feedback to user
      if (error instanceof Error && error.message.includes("message is not modified")) {
        // Just answer the callback without modifying the message
        return await ctx.answerCallbackQuery("Status unchanged. Please try again later.");
      }
      return await ctx.answerCallbackQuery("Error checking status. Please try again.");
    }
  });
  
  // Register command shortcut
  bot.callbackQuery("register", async (ctx) => {
    await sendTermsAndConditions(ctx);
    await ctx.answerCallbackQuery();
  });

  // =====================================
  // Navigation & UI Related Callbacks
  // =====================================
  
  // Handle main menu button press
  bot.callbackQuery("main_menu", async (ctx) => {
    await sendWelcomeMessage(ctx);
    await ctx.answerCallbackQuery("Main menu displayed");
  });
  
  // Handle contact support button
  bot.callbackQuery("contact_support", async (ctx) => {
    await showContactInfo(ctx);
    await ctx.answerCallbackQuery("Support information displayed");
  });
  
  // Handle help button
  bot.callbackQuery("help", async (ctx) => {
    await showHelpInfo(ctx);
    await ctx.answerCallbackQuery();
  });

  // Handle channel membership verification
  bot.callbackQuery("check_channel_membership", async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      // Get channel member information
      const member = await ctx.api.getChatMember("@GameKeyChannel", ctx.from.id);
      
      if (
        member.status === "creator" ||
        member.status === "administrator" ||
        member.status === "member"
      ) {
        // User is a member, welcome them
        await ctx.answerCallbackQuery("✅ Channel membership confirmed!");
        await ctx.reply(
          "Thank you for joining our channel! You can now use the bot.",
          { reply_markup: KeyboardFactory.backToMain() }
        );
        
        // Continue with the regular flow if they haven't started yet
        const user = await UserRepository.findUserByTelegramId(ctx.from.id);
        if (!user) {
          await sendWelcomeMessage(ctx);
        }
      } else {
        // User is still not a member
        await ctx.answerCallbackQuery({ text: "❌ You still need to join the channel", show_alert: true });
        await ctx.reply(
          "You still need to join our channel before using the bot.\n\n" +
          "Please join @GameKeyChannel and try again.",
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "📢 Join Channel", url: "https://t.me/GameKeyChannel" }],
                [{ text: "✅ Check Again", callback_data: "check_channel_membership" }]
              ]
            }
          }
        );
      }
    } catch (error) {
      console.error("Error verifying channel membership:", error);
      await ctx.answerCallbackQuery("Error checking membership. Please try again.");
    }
  });
}

// Helper function to notify user of approval - specific to callback handling
async function notifyUserOfApproval(userId: number): Promise<void> {
  try {
    // Send approval message with clearer instructions
    await bot.api.sendMessage(userId, 
      "🎉 *Your request has been accepted!* 🎉\n\n" + 
      "You can now use the bot and access all features.\n\n" +
      "Just type /start to begin shopping in our digital store.",
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error(`Failed to notify user ${userId} of approval:`, error);
  }
}

// Helper function to notify user of rejection - specific to callback handling
async function notifyUserOfRejection(userId: number): Promise<void> {
  try {
    await bot.api.sendMessage(userId, 
      "❌ *Registration Declined*\n\nWe're sorry, but your registration request has been declined. " +
      "If you believe this is an error, please contact our support.",
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error(`Failed to notify user ${userId} of rejection:`, error);
  }
}
