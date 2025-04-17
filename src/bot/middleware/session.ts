import { session as grammySession } from "grammy";
import { MongoDBAdapter } from "@grammyjs/storage-mongodb";
import { SessionData, createInitialSessionData } from "../types/session";
import { connectToDatabase, getDb } from "../../database/connection";

// Create MongoDB session storage adapter
const getSessionStorage = async () => {
  await connectToDatabase();
  const db = getDb();
  const collection = db.collection("sessions");
  return new MongoDBAdapter<SessionData>({ collection: collection as any });
};

// Initialize session storage
let storage: MongoDBAdapter<SessionData> | null = null;

// Export session middleware with MongoDB persistence
export const sessionMiddleware = grammySession({
  initial: createInitialSessionData,
  getSessionKey: (ctx) => ctx.from?.id.toString() || "anonymous",
  storage: {
    read: async (key) => {
      if (!storage) storage = await getSessionStorage();
      return storage.read(key);
    },
    write: async (key, value) => {
      if (!storage) storage = await getSessionStorage();
      return storage.write(key, value);
    },
    delete: async (key) => {
      if (!storage) storage = await getSessionStorage();
      return storage.delete(key);
    }
  }
});
