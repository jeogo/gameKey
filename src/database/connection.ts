import { MongoClient, Db } from 'mongodb';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/telegram-store';
const MONGODB_URI_FALLBACK =
  process.env.MONGODB_URI_FALLBACK || 'mongodb://localhost:27017/telegram-store';
const DB_NAME = process.env.DB_NAME || 'telegram-store';
let client: MongoClient | null = null;
let db: Db | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Enhanced connection function with retries and fallback
export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  // Try primary URI first, then fallback
  const uriToTry = connectionRetries < 3 ? MONGODB_URI : MONGODB_URI_FALLBACK || MONGODB_URI;
  const uriType = connectionRetries < 3 ? 'Primary' : 'Fallback';

  console.log(
    `🔌 Attempting to connect to MongoDB... (Attempt ${connectionRetries + 1}/${MAX_RETRIES})`
  );
  console.log(`📍 ${uriType} Connection URI: ${uriToTry.replace(/\/\/[^@]+@/, '//***:***@')}`); // Hide credentials in log

  try {
    client = new MongoClient(uriToTry, {
      // Connection configuration with timeouts
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    });

    await client.connect();
    db = client.db(DB_NAME);

    // Test the connection
    await db.command({ ping: 1 });
    console.log('🟢 Connected to MongoDB successfully');

    // Reset retry counter on success
    connectionRetries = 0;

    return db;
  } catch (error) {
    connectionRetries++;
    console.error(
      `❌ Failed to connect to MongoDB (attempt ${connectionRetries}/${MAX_RETRIES}):`,
      error
    );

    if (connectionRetries < MAX_RETRIES) {
      // Wait with shorter delays for faster retry
      const retryDelay = Math.min(2000 + connectionRetries * 1000, 10000); // 2s, 3s, 4s, 5s, 6s max
      console.log(`🔄 Retrying connection in ${retryDelay / 1000} seconds...`);

      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectToDatabase(); // Retry connection
    }

    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  }
}

// Get database instance
export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('MongoDB connection closed');
  }
}
