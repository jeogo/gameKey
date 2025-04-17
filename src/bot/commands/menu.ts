import { Bot, Keyboard } from "grammy";
import { MyContext } from "../types/session";
import { showCategories } from "./products";
import { showOrdersPage } from "./orders";
import { showHelpInfo } from "./help";
import { showSupportInfo } from "./support";
import { sendWelcomeMessage } from "./start";

/**
 * Create a persistent keyboard with the main commands
 */
export function createMainKeyboard(): Keyboard {
  return new Keyboard()
    .text("🛍️ Products").text("🧾 My Orders").row()
    .text("ℹ️ Help").text("📞 Support").row()
    .text("🏠 Main Menu")
    .resized()
    .persistent();
}

/**
 * Show the menu keyboard
 */
export async function showKeyboardMenu(ctx: MyContext): Promise<void> {
  await ctx.reply("Menu enabled. You can now use these buttons for quick access:", {
    reply_markup: createMainKeyboard()
  });
}

/**
 * Hide the menu keyboard
 */
export async function hideKeyboardMenu(ctx: MyContext): Promise<void> {
  await ctx.reply("Menu hidden. Type /menu to show it again.", {
    reply_markup: { remove_keyboard: true }
  });
}

/**
 * Register menu commands and keyboard handlers
 */
export function registerMenuHandlers(bot: Bot<MyContext>): void {
  // Command to show menu
  bot.command("menu", async (ctx) => {
    await showKeyboardMenu(ctx);
  });
  
  // Command to hide menu
  bot.command("hidemenu", async (ctx) => {
    await hideKeyboardMenu(ctx);
  });
  
  // Handle keyboard button presses - map each to the correct command handler
  bot.hears("🛍️ Products", async (ctx) => {
    // Use exactly the same function that the /products command uses
    await showCategories(ctx);
  });
  
  bot.hears("🧾 My Orders", async (ctx) => {
    if (!ctx.from?.id) {
      await ctx.reply("Unable to identify user.");
      return;
    }
    
    // Use exactly the same function that the /orders command uses, starting at page 1
    await showOrdersPage(ctx, ctx.from.id.toString(), 1);
  });
  
  bot.hears("ℹ️ Help", async (ctx) => {
    // Use exactly the same function that the /help command uses
    await showHelpInfo(ctx);
  });
  
  bot.hears("📞 Support", async (ctx) => {
    // Use exactly the same function that the /support command uses
    await showSupportInfo(ctx);
  });
  
  bot.hears("🏠 Main Menu", async (ctx) => {
    // Use exactly the same function that the /start command uses
    await sendWelcomeMessage(ctx);
  });
}
