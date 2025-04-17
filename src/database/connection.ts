import { MongoClient, Db } from 'mongodb';
import { config } from 'dotenv';

config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@e-commerce.cobbugf.mongodb.net/?retryWrites=true&w=majority&appName=E-commerce';
const DB_NAME = process.env.DB_NAME || 'telegram-store';
let client: MongoClient | null = null;
let db: Db | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 5;

// Enhanced connection function with retries
export async function connectToDatabase(): Promise<Db> {
  if (db) return db;
  
  try {
    client = new MongoClient(MONGODB_URI, {
      // Add any MongoDB client options here if needed
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
    console.error(`❌ Failed to connect to MongoDB (attempt ${connectionRetries}/${MAX_RETRIES}):`, error);
    
    if (connectionRetries < MAX_RETRIES) {
      // Wait with exponential backoff before retrying
      const retryDelay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
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
