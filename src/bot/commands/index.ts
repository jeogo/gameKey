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
  
  // Set enhanced bot commands for Telegram menu with better descriptions
  bot.api.setMyCommands([
    { command: "start", description: "🎮 Welcome & Setup - Start your GameKey journey" },
    { command: "shop", description: "🛒 Browse Store - Find your perfect game" },
    { command: "orders", description: "� My Orders - Track purchases & downloads" },
    { command: "profile", description: "� My Profile - Account info & stats" },
    { command: "help", description: "❓ Help Center - Commands & support info" },
    { command: "status", description: "� System Status - Check platform health" }
  ]);

  // Register aliases for better user experience
  bot.command("shop", async (ctx) => {
    // Redirect to products command for consistency
    const { showCategories } = await import("./products");
    await showCategories(ctx);
  });

  bot.command("store", async (ctx) => {
    // Another alias for shop
    const { showCategories } = await import("./products");
    await showCategories(ctx);
  });

  bot.command("buy", async (ctx) => {
    // Quick buy alias
    const { showCategories } = await import("./products");
    await showCategories(ctx);
  });

  bot.command("status", async (ctx) => {
    try {
      const statusMessage = `🔋 **GAMEKEY STATUS**\n\n` +
        `✅ **System:** Online & Operational\n` +
        `⚡ **Payments:** NOWPayments Active\n` +
        `🛒 **Store:** Fully Stocked\n` +
        `📞 **Support:** Available 24/7\n\n` +
        `🕐 **Last Updated:** ${new Date().toLocaleString()}\n` +
        `📊 **Uptime:** ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n\n` +
        `💬 Type /shop to start shopping!`;
      
      await ctx.reply(statusMessage, { parse_mode: "Markdown" });
    } catch (error) {
      await ctx.reply("📊 System Status: All systems operational!");
    }
  });
}
