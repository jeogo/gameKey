import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { registerStartCommand } from "./start";
import { registerHelpCommand } from "./help";
import { registerOrdersCommand } from "./orders";
import { registerSupportCommand } from "./support";
import { registerProductsCommand } from "./products";

/**
 * List of all available commands in the bot
 * This can be used to show users the complete list of commands
 */
export const availableCommands = {
  // User commands
  start: "Start using the bot and see welcome message",
  products: "Browse product categories",
  help: "Show help information and available commands",
  orders: "View your order history",
  support: "Contact customer support",
  
  // Admin commands (only work for admins)
  approve: "Approve a pending user (admin only)",
  pending: "List all pending users (admin only)"
};

export function registerCommands(bot: Bot<MyContext>): void {
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerOrdersCommand(bot);
  registerSupportCommand(bot);
  registerProductsCommand(bot);
  
  // Set commands in Telegram menu to make them easily accessible
  bot.api.setMyCommands([
    { command: "start", description: availableCommands.start },
    { command: "products", description: availableCommands.products },
    { command: "orders", description: availableCommands.orders },
    { command: "help", description: availableCommands.help },
    { command: "support", description: availableCommands.support }
  ]).catch(error => {
    console.error("Error setting bot commands:", error);
  });
}
