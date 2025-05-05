import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import * as OrderRepository from "../../repositories/OrderRepository";
import * as GcoinTransactionRepository from "../../repositories/GcoinTransactionRepository";
import KeyboardFactory from "../keyboards";

/**
 * Display user profile information
 */
async function showProfile(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    // Check if user exists and is approved
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply(
        "⚠️ Your account was not found. Please use /start to set up your account first."
      );
      return;
    }
    
    // Get additional user stats
    const orderCount = await OrderRepository.countOrdersByUser(user._id!);
    const transactions = await GcoinTransactionRepository.findTransactionsByUserId(user._id!);
    
    // Calculate total recharge amount
    const totalRecharge = (transactions as unknown as Array<{ type: string; source: string; amount: number }>)
      .filter((tx) => tx.type === 'CREDIT' && tx.source === 'PURCHASE')
      .reduce((sum: number, tx) => sum + tx.amount, 0);
    
    // Format numbers with thousands separators
    const formattedBalance = user.gcoinBalance.toLocaleString('en-US');
    const formattedRecharge = totalRecharge.toLocaleString('en-US');
    
    // Generate referral link
    const botUsername = process.env.BOT_USERNAME || 'GameKeyBot';
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
    
    // Create profile message with icons and formatting
    const profileMessage = `
📋 *YOUR PROFILE*
───────────────────

📛 *Name:* ${ctx.from.first_name} ${ctx.from.last_name || ''}
${ctx.from.username ? `👤 *Username:* @${ctx.from.username}` : ''}

💰 *Current Balance:* ${formattedBalance} GCoin
💎 *Total Recharge:* ${formattedRecharge} GCoin
📦 *Previous Orders:* ${orderCount}

🔗 *Your Referral Link:*
\`${referralLink}\`

───────────────────
Last updated: ${new Date().toLocaleString()}
`;
    
    // Create inline keyboard with profile options
    const keyboard = KeyboardFactory.profileMenu();
    
    // Determine if we're responding to a command or a callback
    if (ctx.callbackQuery) {
      await ctx.editMessageText(profileMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      await ctx.answerCallbackQuery("Profile updated");
    } else {
      await ctx.reply(profileMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    
  } catch (error) {
    console.error("Error showing profile:", error);
    await ctx.reply("Sorry, an error occurred while retrieving your profile information. Please try again later.");
  }
}

export function registerProfileCommand(bot: Bot<MyContext>): void {
  bot.command("profile", showProfile);
  
  // Refresh profile data
  bot.callbackQuery("refresh_profile", async (ctx) => {
    await showProfile(ctx);
    await ctx.answerCallbackQuery("Profile refreshed");
  });
  
  // Navigate to order history
  bot.callbackQuery("view_orders", async (ctx) => {
    // We'll use the orders command handler
    // This could be improved by making the orders command handler accessible here
    await ctx.editMessageText(
      "Redirecting to your orders...",
      { reply_markup: { inline_keyboard: [] } }
    );
    await ctx.answerCallbackQuery();
    await ctx.reply("/orders");
  });
  
  // Navigate to referrals
  bot.callbackQuery("view_referrals", async (ctx) => {
    // We'll use the referrals command handler
    await ctx.editMessageText(
      "Redirecting to referral program...",
      { reply_markup: { inline_keyboard: [] } }
    );
    await ctx.answerCallbackQuery();
    await ctx.reply("/referrals");
  });
}