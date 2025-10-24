import { startBot } from './bot';
import { startServer } from './server';
import { config } from 'dotenv';
import { connectToDatabase, closeDatabase } from './database/connection';
import { initializeDatabase } from './database/optimization';

// Load environment variables
config();

// Main application startup with proper sequence
async function main(): Promise<void> {
  try {
    // First connect to database
    console.log('🔌 Connecting to MongoDB...');
    await connectToDatabase();
    console.log('✅ Database connected successfully');

    // Initialize database optimizations (indexes, etc.)
    console.log('⚡ Optimizing database performance...');
    await initializeDatabase();
    console.log('✅ Database optimizations applied');

    // Then start the Express server
    console.log('🚀 Starting Express server...');
    await startServer();
    console.log('✅ Express server started successfully');

    // Finally start the Telegram bot
    console.log('🤖 Starting Telegram bot...');
    await startBot();
    console.log('✅ Telegram bot started successfully');

    console.log('🎉 All systems are operational!');

    // Setup graceful shutdown
    setupShutdownHandlers();
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    await cleanup();
    process.exit(1);
  }
}

// Cleanup function to close resources
async function cleanup(): Promise<void> {
  console.log('🧹 Cleaning up resources...');
  try {
    await closeDatabase();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Handle graceful shutdown
function setupShutdownHandlers(): void {
  // Handle SIGTERM (Docker, Kubernetes, etc.)
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM signal received. Shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT signal received. Shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async error => {
    console.error('❌ Uncaught exception:', error);
    await cleanup();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async reason => {
    console.error('❌ Unhandled promise rejection:', reason);
    await cleanup();
    process.exit(1);
  });
}

// Run the application
main();
