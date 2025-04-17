import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import { bot } from "../../bot";
import { isAdmin } from "../../utils/adminUtils";

export function registerAdminHandlers(bot: Bot<MyContext>): void {
  // Admin command to approve users
  bot.command("approve", async (ctx) => {
    if (!ctx.from) return;
    
    // Check if sender is admin
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply("You don't have permission to use this command.");
      return;
    }
    
    // Extract user ID from command arguments
    const args = ctx.message?.text.split(" ");
    if (!args || args.length < 2) {
      await ctx.reply("Usage: /approve [user_id]");
      return;
    }
    
    const userIdToApprove = parseInt(args[1], 10);
    if (isNaN(userIdToApprove)) {
      await ctx.reply("Invalid user ID format.");
      return;
    }
    
    try {
      // Approve the user
      const user = await UserRepository.findUserByTelegramId(userIdToApprove);
      if (!user) {
        await ctx.reply(`User with ID ${userIdToApprove} not found.`);
        return;
      }
      
      if (user.isAccepted) {
        await ctx.reply(`User ${userIdToApprove} is already approved.`);
        return;
      }
      
      await UserRepository.updateUserAcceptance(userIdToApprove, true);
      await ctx.reply(`User ${userIdToApprove} has been approved.`);
      
      // Notify the user
      try {
        await bot.api.sendMessage(
          userIdToApprove, 
          "Your account has been approved! You can now use all features of the bot. Type /start to begin."
        );
      } catch (error) {
        await ctx.reply(`Note: Could not notify user ${userIdToApprove} about approval.`);
      }
    } catch (error) {
      console.error("Error approving user:", error);
      await ctx.reply("An error occurred while approving the user.");
    }
  });
  
  // List pending users
  bot.command("pending", async (ctx) => {
    if (!ctx.from) return;
    
    // Check if sender is admin
    if (!isAdmin(ctx.from.id)) {
      await ctx.reply("You don't have permission to use this command.");
      return;
    }
    
    try {
      // Get all pending users
      const pendingUsers = await UserRepository.findAllUsers({ isAccepted: false });
      
      if (pendingUsers.length === 0) {
        await ctx.reply("No pending users.");
        return;
      }
      
      let message = "*Pending Users*\n\n";
      pendingUsers.forEach((user, index) => {
        message += `${index + 1}. ID: ${user.telegramId} | @${user.username || "no_username"} | Registered: ${new Date(user.createdAt).toLocaleDateString()}\n`;
      });
      
      message += "\nTo approve a user, use: /approve [user_id]";
      
      await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
      console.error("Error fetching pending users:", error);
      await ctx.reply("An error occurred while fetching pending users.");
    }
  });

  // User approval handler
  bot.callbackQuery(/^approve_user_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("Admin not found");
    
    // Check if the user is an admin 
    if (!isAdmin(ctx.from.id)) {
      return await ctx.answerCallbackQuery("Unauthorized: Only admins can perform this action");
    }

    const userIdToApprove = parseInt(ctx.match[1]);
    
    try {
      // Find and update the user's acceptance status
      const user = await UserRepository.findUserByTelegramId(userIdToApprove);
      
      if (!user) {
        return await ctx.answerCallbackQuery("User not found");
      }
      
      // Update user status to approved
      const updatedUser = await UserRepository.updateUserAcceptance(userIdToApprove, true);
      
      if (updatedUser) {
        // Update the message to show approved status
        await ctx.editMessageText(
          ctx.callbackQuery.message?.text + "\n\n✅ *APPROVED*",
          { 
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [] } // Remove buttons after action
          }
        );
        
        // Notify the user that they've been approved
        await notifyUserOfApproval(userIdToApprove);
        
        await ctx.answerCallbackQuery("User has been approved");
      } else {
        await ctx.answerCallbackQuery("Failed to update user status");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      await ctx.answerCallbackQuery("Error processing approval");
    }
  });

  // User rejection handler
  bot.callbackQuery(/^decline_user_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("Admin not found");
    
    // Check if the user is an admin
    if (!isAdmin(ctx.from.id)) {
      return await ctx.answerCallbackQuery("Unauthorized: Only admins can perform this action");
    }

    const userIdToDecline = parseInt(ctx.match[1]);
    
    try {
      // Find the user
      const user = await UserRepository.findUserByTelegramId(userIdToDecline);
      
      if (!user) {
        return await ctx.answerCallbackQuery("User not found");
      }
      
      // Keep the user in the database but mark as not accepted
      const updatedUser = await UserRepository.updateUserAcceptance(userIdToDecline, false);
      
      if (updatedUser) {
        // Update the message to show declined status
        await ctx.editMessageText(
          ctx.callbackQuery.message?.text + "\n\n❌ *DECLINED*",
          { 
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [] } // Remove buttons after action
          }
        );
        
        // Notify the user that they've been declined
        await notifyUserOfRejection(userIdToDecline);
        
        await ctx.answerCallbackQuery("User has been declined");
      } else {
        await ctx.answerCallbackQuery("Failed to update user status");
      }
    } catch (error) {
      console.error("Error declining user:", error);
      await ctx.answerCallbackQuery("Error processing decline");
    }
  });
}

// Helper function to notify user of approval
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

// Helper function to notify user of rejection
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
