import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { registerStartCommand } from "./start";
import { registerHelpCommand } from "./help";
import { registerProductsCommand } from "./products";
import { registerOrdersCommand } from "./orders";
import { registerMenuCommand } from "./menu";
import { registerSupportCommand } from "./support";
import { registerProfileCommand } from "./profile";

/**
 * Register all bot commands with clear command menu
 */
export function registerCommands(bot: Bot<MyContext>): void {
  // Register each command group
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerProductsCommand(bot);
  registerOrdersCommand(bot);
  registerMenuCommand(bot);
  registerSupportCommand(bot);
  registerProfileCommand(bot);
  
  // Set clear bot commands for Telegram menu
  bot.api.setMyCommands([
    { command: "start", description: "🚀 Start/restart the bot" },
    { command: "menu", description: "🏠 Show main menu" },
    { command: "products", description: "🛍️ Browse products catalog" },
    { command: "orders", description: "📜 View your order history" },
    { command: "profile", description: "👤 View your profile" },
    { command: "help", description: "💬 Get help and commands" },
    { command: "support", description: "📞 Contact customer support" }
  ]);
}
