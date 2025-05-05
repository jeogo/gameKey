import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
import * as UserRepository from "../../repositories/UserRepository";
import { isAdmin } from "../../utils/adminUtils";
import { processReferralCode } from "./referrals";

/**
 * Handle /start command
 */
async function startCommand(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Handle start with parameters (like referral codes)
    if (ctx.match) {
      const param = ctx.match.toString();
      
      // Handle referral codes
      if (param.startsWith("ref_")) {
        const referralCode = param.substring(4);
        await processReferralCode(ctx, referralCode);
      }
    }
    
    // Check if user exists in database
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (user) {
      // User exists, show main menu
      ctx.session.step = "approved";
      
      // Get user's GCoin balance
      const formattedBalance = user.gcoinBalance.toLocaleString('en-US');
      
      await ctx.reply(
        `👋 Welcome to GameKey Store!\n\n` +
        `Current GCoin balance: *${formattedBalance} GCoin*\n\n` +
        `Choose one of the options below to continue:`,
        {
          parse_mode: "Markdown",
          reply_markup: KeyboardFactory.mainMenu()
        }
      );
    } else {
      // New user, start registration flow
      ctx.session.step = "terms";
      
      const isAdminUser = isAdmin(ctx.from.id);
      
      if (isAdminUser) {
        // Admin users get auto-approved
        const newUser = await UserRepository.createOrUpdateUser({
          telegramId: ctx.from.id,
          username: ctx.from.username
        });
        
        ctx.session.step = "approved";
        
        await ctx.reply(
          `👋 Welcome to GameKey Control Panel!\n\n` +
          `You have been recognized as an administrator. You have access to all features.`,
          {
            reply_markup: KeyboardFactory.mainMenu()
          }
        );
      } else {
        // Regular user registration with terms
        await ctx.reply(
          "👋 Welcome to GameKey Store!\n\n" +
          "To proceed, please read and accept the terms of service:\n\n" +
          "1. This bot is used only for purchasing digital products.\n" +
          "2. All sales are final and non-refundable.\n" +
          "3. We are not responsible for issues resulting from misuse.\n\n" +
          "Do you agree to these terms?",
          {
            reply_markup: KeyboardFactory.terms()
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in start command:", error);
    await ctx.reply("Sorry, an error occurred while processing your request. Please try again later.");
  }
}

export function registerStartCommand(bot: Bot<MyContext>): void {
  bot.command("start", startCommand);
}
