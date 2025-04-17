import { Bot } from "grammy";
import { config } from "dotenv";
import { MyContext } from "./bot/types/session";
import { registerCommands } from "./bot/commands";
import { registerRegistrationHandlers } from "./bot/handlers/registrationHandlers";  
import { registerAdminHandlers } from "./bot/handlers/adminHandlers";
import { registerMessageHandlers } from "./bot/handlers/messageHandlers";
import { registerCallbackHandlers } from "./bot/handlers/callbackHandlers";
import { sessionMiddleware } from "./bot/middleware/session";
import { errorHandler } from "./bot/middleware/errorHandler";
import { authMiddleware } from "./bot/middleware/auth";
import { requireChannelMembership } from "./bot/middleware/channelMembership";
import { registerMenuHandlers } from "./bot/commands/menu";

// Load environment variables
config();

// Get API token from environment variables with validation
const apiToken = process.env.API_TOKEN;
if (!apiToken) {
  throw new Error("API_TOKEN is not defined in environment variables");
}

// Create bot with API token
export const bot = new Bot<MyContext>(apiToken);

// Apply middleware
bot.use(sessionMiddleware);
bot.use(requireChannelMembership);
bot.use(errorHandler);
bot.use(authMiddleware);

// Register handlers in the correct order
registerCommands(bot);
registerCallbackHandlers(bot);
registerRegistrationHandlers(bot);
registerAdminHandlers(bot);
registerMenuHandlers(bot); // Register menu handlers
registerMessageHandlers(bot); // Register this last to avoid conflicts

// Start bot function to be called from index.ts
export async function startBot(): Promise<void> {
  try {
    console.log("🤖 Bot is starting...");
    await bot.start({
      onStart: () => console.log("🤖 Bot is now active and listening for events"),
      drop_pending_updates: true,
    });
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    throw error;
  }
}

// Stop bot function
export async function stopBot(): Promise<void> {
  try {
    await bot.stop();
    console.log("🤖 Bot stopped");
  } catch (error) {
    console.error("❌ Error stopping bot:", error);
    throw error;
  }
}