import express, { Request, Response } from "express";
import cors from "cors";
import { config } from "dotenv";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes"; // Add this import
import bodyParser from 'body-parser';

config();

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);
let server: any = null;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.send("Telegram Store API is running!");
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes); // Add this route

// Start server function - now returns a Promise
export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      server = app.listen(PORT, () => {
        console.log(`🌐 Express server is running on http://localhost:${PORT}`);
        resolve();
      });
      
      // Handle server errors
      server.on('error', (error: Error) => {
        console.error('❌ Server error:', error);
        reject(error);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      reject(error);
    }
  });
}

// Stop server function
export function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err: Error) => {
        if (err) {
          console.error('❌ Error stopping server:', err);
          reject(err);
        } else {
          console.log('✅ Server stopped');
          resolve();
        }
      });
    } else {
      resolve(); // Server wasn't running
    }
  });
}

// Export app for testing purposes
export { app };
