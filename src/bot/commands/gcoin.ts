import { Bot } from "grammy";
import { MyContext } from "../types/session";
import KeyboardFactory from "../keyboards";
import GcoinService from "../../services/GcoinService";
import * as UserRepository from "../../repositories/UserRepository";
import * as GcoinTransactionRepository from "../../repositories/GcoinTransactionRepository";
import * as PaymentRepository from "../../repositories/PaymentRepository";
import { nowPaymentsService } from "../../services/NowPaymentsService";

/**
 * Display user's GCoin balance and options
 */
export async function showGcoinBalance(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Account not found. Please use /start to register first.");
      return;
    }
    
    // Format balance with thousands separator
    const formattedBalance = user.gcoinBalance.toLocaleString('en-US');
    
    const message = `
💰 *Your GCoin Balance*

You currently have *${formattedBalance} GCoin* in your account.

You can use GCoin to purchase products in the store. 
Exchange rate: 1$ = approximately 10 GCoin.

What would you like to do?
`;
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.gcoinMenu()
      });
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.gcoinMenu()
      });
    }
    
  } catch (error) {
    console.error("Error showing GCoin balance:", error);
    await ctx.reply("An error occurred while displaying your balance. Please try again later.");
  }
}

/**
 * Show options to buy more GCoins
 */
export async function showBuyGcoinOptions(ctx: MyContext): Promise<void> {
  try {
    const message = `
💰 *Buy GCoin*

Choose one of the following options or specify a custom amount:
• 100 GCoin = $10
• 500 GCoin = $45 (10% savings)
• 1000 GCoin = $80 (20% savings)

All payments are securely processed through NOWPayments.
`;
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.gcoinMenu()
      });
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.gcoinMenu()
      });
    }
    
  } catch (error) {
    console.error("Error showing buy GCoin options:", error);
    await ctx.reply("An error occurred while displaying purchase options. Please try again later.");
  }
}

/**
 * Initiate GCoin purchase
 */
export async function initiateBuyGcoin(ctx: MyContext, amount: number): Promise<void> {
  try {
    if (!ctx.from) {
      await ctx.reply("Unable to identify user. Please try again.");
      return;
    }
    
    const userId = ctx.from.id.toString();
    let usdAmount: number;
    let gcoinAmount: number;
    
    // Calculate USD amount based on GCoin amount with volume discounts
    if (amount === 100) {
      usdAmount = 10;
      gcoinAmount = 100;
    } else if (amount === 500) {
      usdAmount = 45;
      gcoinAmount = 500;
    } else if (amount === 1000) {
      usdAmount = 80;
      gcoinAmount = 1000;
    } else if (amount > 0) {
      // Custom amount - Apply discount tiers
      if (amount < 200) {
        usdAmount = Math.ceil(amount / 10);
      } else if (amount < 500) {
        usdAmount = Math.ceil((amount / 10) * 0.95); // 5% discount
      } else if (amount < 1000) {
        usdAmount = Math.ceil((amount / 10) * 0.9); // 10% discount
      } else {
        usdAmount = Math.ceil((amount / 10) * 0.8); // 20% discount
      }
      gcoinAmount = amount;
    } else {
      await ctx.reply("Invalid amount. Please specify a positive number of GCoin.");
      return;
    }
    
    // Create payment request
    const paymentOptions = {
      amount: usdAmount,
      currency: "USD",
      description: `Purchase of ${gcoinAmount} GCoin`,
      successUrl: process.env.NOWPAYMENTS_SUCCESS_URL || "https://gamekey.onrender.com/payment/success",
      cancelUrl: process.env.NOWPAYMENTS_CANCEL_URL || "https://gamekey.onrender.com/payment/cancel",
      metadata: {
        userId,
        gcoinAmount,
        type: "buy_gcoin"
      },
      payCurrency: ctx.session?.payCurrency || 'usdt'
    };
    
    const paymentTx = await nowPaymentsService.createPayment(paymentOptions);

    // Save transaction in DB
    const savedTx = await PaymentRepository.createTransaction({
      userId,
      orderId: "", // Not tied to an order since it's GCoin purchase
      paymentProvider: "nowpayments",
      amount: paymentTx.amount,
      currency: paymentTx.currency,
      status: "pending",
      metadata: paymentTx.metadata
    });

    // Send an attractive payment page with buttons
    await ctx.reply(
      `🔐 *Secure Payment Gateway*\n\n` +
      `Your order for *${gcoinAmount} GCoin* is ready!\n\n` + 
      `Amount: $${usdAmount}\n` +
      `Please click the button below to complete your payment.`,
      {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.paymentLink(savedTx.paymentUrl!, savedTx._id!)
      }
    );
    
  } catch (error) {
    console.error("Error initiating GCoin purchase:", error);
    await ctx.reply("An error occurred while setting up the purchase transaction. Please try again later.");
  }
}

/**
 * Handle GCoin purchase completion (called from payment handler)
 */
export async function handleGcoinPurchaseSuccess(
  userId: string,
  amount: number,
  paymentId: string
): Promise<boolean> {
  try {
    // Add GCoins to user's account
    const updatedUser = await GcoinService.purchaseGcoins(
      userId,
      amount,
      paymentId,
      `Purchase of ${amount} GCoins via payment #${paymentId}`
    );
    
    if (!updatedUser) {
      console.error(`Failed to add ${amount} GCoins to user ${userId}`);
      return false;
    }
    
    // Send success message to user
    try {
      await bot.api.sendMessage(
        parseInt(userId),
        `
✅ *GCoin Purchase Successful!*

*${amount} GCoin* has been successfully added to your account.
Current balance: *${updatedUser.gcoinBalance} GCoin*

You can now use GCoin to purchase products in the store.
        `,
        { parse_mode: "Markdown" }
      );
    } catch (sendError) {
      console.error("Error sending GCoin purchase success message:", sendError);
    }
    
    return true;
  } catch (error) {
    console.error("Error handling GCoin purchase success:", error);
    return false;
  }
}

/**
 * Show user's GCoin transaction history
 */
export async function showGcoinTransactions(ctx: MyContext, page: number = 1): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Account not found. Please use /start to register first.");
      return;
    }
    
    const pageSize = 5;
    const result = await GcoinTransactionRepository.findTransactionsByUserId(user._id!, page, pageSize);
    
    if (result.transactions.length === 0 && page > 1) {
      // If no transactions on this page but page > 1, show the first page
      return showGcoinTransactions(ctx, 1);
    }
    
    let message = `
💰 *GCoin Transaction History*

Current balance: *${user.gcoinBalance} GCoin*\n\n`;
    
    if (result.transactions.length === 0) {
      message += "No transactions yet.";
    } else {
      message += "Recent transactions:\n\n";
      
      for (const transaction of result.transactions) {
        const dateStr = new Date(transaction.createdAt).toLocaleDateString();
        const amount = transaction.amount;
        const symbol = amount >= 0 ? "+" : "";
        
        message += `${dateStr} — ${symbol}${amount} GCoin\n`;
        message += `${transaction.description}\n\n`;
      }
      
      const totalPages = Math.ceil(result.total / pageSize);
      message += `Page ${page} of ${totalPages}`;
    }
    
    const response = {
      parse_mode: "Markdown" as const,
      reply_markup: KeyboardFactory.transactionsWithPagination(page, Math.ceil(result.total / pageSize))
    };
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, response);
    } else {
      await ctx.reply(message, response);
    }
    
  } catch (error) {
    console.error("Error showing GCoin transactions:", error);
    await ctx.reply("An error occurred while displaying transaction history. Please try again later.");
  }
}

let bot: Bot<MyContext>;

export function registerGcoinCommands(botInstance: Bot<MyContext>): void {
  bot = botInstance;
  
  // Command to check GCoin balance
  bot.command("gcoin", showGcoinBalance);
  
  // Command to buy GCoin
  bot.command("buy_gcoins", showBuyGcoinOptions);
  
  // Command to view transaction history
  bot.command("transactions", (ctx) => showGcoinTransactions(ctx));
  
  // Handle callback queries
  bot.callbackQuery("my_gcoin", async (ctx) => {
    await showGcoinBalance(ctx);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("buy_gcoin", async (ctx) => {
    await showBuyGcoinOptions(ctx);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("gcoin_transactions", async (ctx) => {
    await showGcoinTransactions(ctx);
    await ctx.answerCallbackQuery();
  });
  
  // Handle GCoin purchase options
  bot.callbackQuery("buy_gcoin_100", async (ctx) => {
    await initiateBuyGcoin(ctx, 100);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("buy_gcoin_500", async (ctx) => {
    await initiateBuyGcoin(ctx, 500);
    await ctx.answerCallbackQuery();
  });
  
  bot.callbackQuery("buy_gcoin_1000", async (ctx) => {
    await initiateBuyGcoin(ctx, 1000);
    await ctx.answerCallbackQuery();
  });
  
  // Handle custom amount
  bot.callbackQuery("buy_gcoin_custom", async (ctx) => {
    await ctx.reply("Please enter the amount of GCoin you'd like to purchase (e.g., 250):");
    ctx.session.step = "buy_gcoin_custom";
    await ctx.answerCallbackQuery();
  });
  
  // Handle transactions pagination
  bot.callbackQuery(/^transactions_page_(\d+)$/, async (ctx) => {
    const page = parseInt(ctx.match![1]);
    await showGcoinTransactions(ctx, page);
    await ctx.answerCallbackQuery();
  });
}