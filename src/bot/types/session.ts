import { Context, SessionFlavor } from "grammy";

/**
 * Session data for the bot
 */
export interface SessionData {
  // Conversation state
  step?: "terms" | "pending" | "approved" | "support" | "buy_gcoin_custom";
  
  // For product browsing
  currentCategoryId?: string;
  currentProductId?: string;
  
  // For payment
  payCurrency?: string; // User's preferred payment currency
  
  // Temporary data storage
  tempData?: {
    orderNote?: string;
    gcoinAmount?: number;
  };
}

// Create a custom context type with session data
export type MyContext = Context & SessionFlavor<SessionData>;

// Initial session data
export function createInitialSessionData(): SessionData {
  return {
    // Default state is undefined - will start with terms acceptance
    step: undefined,
    
    // Default payment currency is USDT
    payCurrency: "usdt",
    
    // Empty temporary data
    tempData: {}
  };
}


