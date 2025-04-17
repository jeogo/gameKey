import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as UserRepository from "../../repositories/UserRepository";
import { availableCommands } from "./index";
import { messages } from "../utils/messages";
import KeyboardFactory from "../keyboards";
import { createMainMenu } from "../keyboards/persistentKeyboard";
import { createMainKeyboard } from "./menu";

export async function sendTermsAndConditions(ctx: MyContext): Promise<void> {
  await ctx.reply(messages.terms, {
    parse_mode: "Markdown",
    reply_markup: KeyboardFactory.terms()
  });
  
  // Set session step to await terms response
  ctx.session.step = "terms";
}

export async function sendWelcomeMessage(ctx: MyContext): Promise<void> {
  const welcomeText = `
Welcome to our Digital Store! 👋

*Available Commands:*
/start - Show this welcome message
/products - Browse our product catalog
/help - Display help information
/orders - Check your order history
/support - Contact our support team
/menu - Show button menu

Use commands or the buttons below for navigation!
`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(welcomeText, {
      parse_mode: "Markdown"
    });
    
    // Show keyboard menu after editing message
    await ctx.reply("Use these quick access buttons:", {
      reply_markup: createMainKeyboard()
    });
  } else {
    await ctx.reply(welcomeText, {
      parse_mode: "Markdown",
      reply_markup: createMainKeyboard() // Show keyboard by default
    });
  }
}

export function registerStartCommand(bot: Bot<MyContext>): void {
  bot.command("start", async (ctx) => {
    // Everything is handled by the channel membership middleware
    // If the user hasn't joined the channel, they'll be prompted to join
    // If they have joined, this code will execute
    
    const telegramId = ctx.from?.id;
    
    if (!telegramId) {
      await ctx.reply("Sorry, unable to identify user.");
      return;
    }

    // Check if user already exists in database
    const existingUser = await UserRepository.findUserByTelegramId(telegramId);

    if (existingUser) {
      if (existingUser.isAccepted) {
        // User is already approved, show welcome message with commands
        ctx.session.step = "approved"; // Explicitly reset session step
        await sendWelcomeMessage(ctx);
      } else {
        // User is registered but pending approval
        ctx.session.step = "pending"; // Explicitly set to pending
        await ctx.reply(
          "Your registration is pending approval. We'll notify you when an admin approves your account."
        );
      }
    } else {
      // New user, show terms and conditions
      await sendTermsAndConditions(ctx);
    }
  });
}
