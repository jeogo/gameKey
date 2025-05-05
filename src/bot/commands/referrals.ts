import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
import * as UserRepository from "../../repositories/UserRepository";
import * as ReferralRepository from "../../repositories/ReferralRepository";
import GcoinService from "../../services/GcoinService";

/**
 * Show the main referral menu
 */
export async function showReferralMenu(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Account not found. Please use /start to register first.");
      return;
    }
    
    const message = `
👥 *Referral System*

Invite your friends to use the bot and earn GCoin!
• Get 50 GCoin for each friend who registers using your referral link.
• Get an additional 100 GCoin when your friend makes their first purchase.

Total earnings from referrals: *${user.totalReferralEarnings} GCoin*

Choose an option below to manage your referrals.
`;
    
    const keyboard = KeyboardFactory.referralMenu();
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    
  } catch (error) {
    console.error("Error showing referral menu:", error);
    await ctx.reply("An error occurred while displaying the referral menu. Please try again later.");
  }
}

/**
 * Get user's referral link
 */
export async function getReferralLink(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Account not found. Please use /start to register first.");
      return;
    }
    
    const botUsername = process.env.BOT_USERNAME || 'GameKeyBot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
    
    const message = `
🔗 *Your Referral Link*

Here is your referral link. Share it with friends and earn rewards!

\`${referralLink}\`

*How to use this link:*
1. Copy the link above and share it with your friends.
2. When your friend clicks the link and starts using the bot, you'll receive a reward.
3. You'll receive an additional reward when your friend makes their first purchase.

*Rewards:*
• Friend registration: 50 GCoin
• Friend's first purchase: 100 GCoin
`;
    
    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.backToMain()
    });
    
  } catch (error) {
    console.error("Error getting referral link:", error);
    await ctx.reply("An error occurred while retrieving your referral link. Please try again later.");
  }
}

/**
 * Show referral statistics
 */
export async function showReferralStats(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Account not found. Please use /start to register first.");
      return;
    }
    
    const stats = await ReferralRepository.getReferralStats(user._id!);
    
    const message = `
📊 *Referral Statistics*

Here are your referral statistics:

👥 *Referrals:*
• Total referrals: ${stats.totalReferrals}
• Completed referrals: ${stats.completedReferrals}
• Pending referrals: ${stats.pendingReferrals}

💰 *Rewards:*
• Total GCoin earned: ${stats.totalGcoinsEarned}
• Total referral balance: ${user.totalReferralEarnings}

Keep inviting more friends to earn more rewards!
`;
    
    await ctx.reply(message, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.backToMain()
    });
    
  } catch (error) {
    console.error("Error showing referral stats:", error);
    await ctx.reply("An error occurred while displaying referral statistics. Please try again later.");
  }
}

/**
 * Process referral code when a user starts the bot
 */
export async function processReferralCode(ctx: MyContext, referralCode: string): Promise<boolean> {
  try {
    if (!ctx.from) return false;
    
    const telegramId = ctx.from.id;
    
    // Check if user already exists
    const existingUser = await UserRepository.findUserByTelegramId(telegramId);
    if (existingUser) {
      // User already exists, cannot be referred again
      console.log(`User ${telegramId} already exists, cannot process referral code`);
      return false;
    }
    
    // Create new user with referrer ID
    const newUser = await UserRepository.createOrUpdateUser({
      telegramId,
      username: ctx.from.username,
      referrerId: referralCode  // Store the referral code temporarily
    });
    
    if (!newUser || !newUser._id) {
      console.error(`Failed to create user for ${telegramId} with referral code ${referralCode}`);
      return false;
    }
    
    // Process the referral
    const success = await GcoinService.processReferralSignup(referralCode, newUser._id);
    
    if (success) {
      await ctx.reply(
        "You've been successfully registered through a referral link. Your friend will receive a reward when your account is approved."
      );
    }
    
    return success;
    
  } catch (error) {
    console.error("Error processing referral code:", error);
    return false;
  }
}

let bot: Bot<MyContext>;

export function registerReferralCommands(botInstance: Bot<MyContext>): void {
  bot = botInstance;
  
  // Command to access referral system
  bot.command("referrals", showReferralMenu);
  
  // Handle callback queries
  bot.callbackQuery("my_referrals", async (ctx) => {
    await showReferralMenu(ctx);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("get_referral_link", async (ctx) => {
    await getReferralLink(ctx);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("referral_stats", async (ctx) => {
    await showReferralStats(ctx);
    await ctx.answerCallbackQuery();
  });
}