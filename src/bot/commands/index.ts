import { Bot } from "grammy";
import { MyContext } from "../types/session";
import { registerStartCommand } from "./start";
import { registerHelpCommand } from "./help";
import { registerProductsCommand } from "./products";
import { registerOrdersCommand } from "./orders";
import { registerGcoinCommands } from "./gcoin";
import { registerMenuCommand } from "./menu";
import { registerSupportCommand } from "./support";
import { registerReferralCommands } from "./referrals";
import { registerProfileCommand } from "./profile";

/**
 * Register all bot commands
 */
export function registerCommands(bot: Bot<MyContext>): void {
  // Register each command group
  registerStartCommand(bot);
  registerHelpCommand(bot);
  registerProductsCommand(bot);
  registerOrdersCommand(bot);
  registerGcoinCommands(bot);
  registerMenuCommand(bot);
  registerSupportCommand(bot);
  registerReferralCommands(bot);
  registerProfileCommand(bot);
  
  // Set bot commands for menu
  bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "menu", description: "Show main menu" },
    { command: "products", description: "Browse products" },
    { command: "orders", description: "View your orders" },
    { command: "gcoin", description: "Check your GCoin balance" },
    { command: "profile", description: "View your profile" },
    { command: "referrals", description: "Referral program" },
    { command: "help", description: "Get help" },
    { command: "support", description: "Contact support" }
  ]);
}
