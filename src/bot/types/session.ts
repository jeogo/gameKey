import { Context, SessionFlavor } from "grammy";
import { ISession } from "@grammyjs/storage-mongodb";

// Define session data structure that extends ISession
export interface SessionData extends ISession {
  _id: { $oid: string; };
  key: string;
  value: any;
  lastStep: string;
  step:
    | "pending"
    | "terms"
    | "approved"
    | "browsing"
    | "checkout"
    | "product_view"
    | "selecting_category"
    | "selecting_product"
    | "confirming_order"
    | "awaiting_crypto_hash";
  lastCategoryId?: string;
  lastProductId?: string;
  lastOrderId?: string;
  userId?: string;
  tempData: Record<string, any>;
}

// Initial session data creator
export function createInitialSessionData(): SessionData {
  return {
    _id: { $oid: "" }, // Add empty _id field
    lastStep: "",
    step: "pending",
    tempData: {},
    // Add required ISession fields
    key: "", // Provide a non-undefined value for key
    value: undefined
  };
}

// Define context type with session data
export type MyContext = Context & SessionFlavor<SessionData>;


