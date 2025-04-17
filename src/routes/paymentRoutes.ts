import express, { Request, Response } from "express";
import { paymentProcessor } from "../services/PaymentProcessor";
import * as PaymentRepository from "../repositories/PaymentRepository";
import * as PaymentController from "../controllers/PaymentController";
import * as OrderRepository from "../repositories/OrderRepository";

const router = express.Router();

// Get all transactions
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    // Build filter from query params
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.provider) filter.paymentProvider = req.query.provider;

    const result = await PaymentController.getAllTransactions(
      filter,
      page,
      limit
    );
    res.json(result);
  } catch (error) {
    console.error("Error in GET /payments:", error);
    res.status(500).json({ error: "Failed to retrieve payment transactions" });
  }
});

// Get user's transactions
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await PaymentController.getUserTransactions(
      userId,
      page,
      limit
    );
    res.json(result);
  } catch (error) {
    console.error(`Error in GET /payments/user/${req.params.userId}:`, error);
    res.status(500).json({ error: "Failed to retrieve user transactions" });
  }
});

// Get transaction by ID
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const transaction = await PaymentController.getTransactionById(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(`Error in GET /payments/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve payment transaction" });
  }
});

// Get transactions for order
router.get("/order/:orderId", async (req: Request, res: Response) => {
  try {
    const transactions = await PaymentController.getOrderTransactions(
      req.params.orderId
    );
    res.json(transactions);
  } catch (error) {
    console.error(`Error in GET /payments/order/${req.params.orderId}:`, error);
    res.status(500).json({ error: "Failed to retrieve order transactions" });
  }
});

// Update transaction status - add support for both PATCH and PUT
router.patch(
  "/:id/status",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { status, ...additionalData } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedTransaction =
        await PaymentController.updateTransactionStatus(
          req.params.id,
          status,
          additionalData
        );

      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error(`Error in PATCH /payments/${req.params.id}/status:`, error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  }
);

// Add PUT endpoint that mirrors the PATCH endpoint
router.put(
  "/:id/status",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { status, ...additionalData } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedTransaction =
        await PaymentController.updateTransactionStatus(
          req.params.id,
          status,
          additionalData
        );

      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error(`Error in PUT /payments/${req.params.id}/status:`, error);
      res.status(500).json({ error: "Failed to update payment status" });
    }
  }
);

// Check payment status
router.get("/:id/check", async (req: Request, res: Response): Promise<any> => {
  try {
    const transaction = await PaymentController.checkPaymentStatus(
      req.params.id
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(`Error in GET /payments/${req.params.id}/check:`, error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

// Get payment statistics
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const stats = await PaymentController.getPaymentStatistics(
      startDate,
      endDate
    );
    res.json(stats);
  } catch (error) {
    console.error("Error in GET /payments/stats/summary:", error);
    res.status(500).json({ error: "Failed to retrieve payment statistics" });
  }
});

// Handle PayPal return URL
router.get(
  "/paypal-return",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: "Missing PayPal token" });
      }

      // Get transaction by PayPal order ID
      const transaction =
        await PaymentRepository.findTransactionByPaypalOrderId(token as string);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      try {
        // Use PaymentProcessor instead of paypalService
        const captureResult = await paymentProcessor.capturePayPalPayment(token as string);
        
        if (captureResult.status === "completed") {
          // Update transaction
          await PaymentRepository.updateTransactionWithPaypalData(
            transaction._id!,
            {
              paypalCaptureId: captureResult.externalId,
              status: "completed",
            }
          );
          
          // Update order status
          await OrderRepository.updateOrderStatus(
            transaction.orderId,
            "completed",
            "Payment completed via PayPal"
          );
        }
      } catch (err) {
        console.error("Error capturing PayPal payment:", err);
        // Don't reject the response, still show success to user
      }

      return res
        .status(200)
        .json({ message: "Payment received. You can now return to Telegram." });
    } catch (error) {
      console.error("Error processing PayPal return:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while processing your payment" });
    }
  }
);

// Handle PayPal cancel URL
router.get("/paypal-cancel", (_req: Request, res: Response): void => {
  res.status(200).json({
    message:
      "Payment cancelled. Please return to Telegram to try again or choose another payment method.",
  });
});

// Handle PayPal webhook notifications
router.post(
  "/paypal-webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response):Promise<any> => {
    try {
      const webhookSecret = process.env.PAYPAL_WEBHOOK_ID;

      // Need to verify the webhook signature if in production
      if (process.env.NODE_ENV === "production" && webhookSecret) {
        // Verify webhook signature using PaymentProcessor
        const isValid = paymentProcessor.verifyPaypalWebhook(req.headers as Record<string, string>, req.body);
        if (!isValid) {
          return res.status(403).send('Invalid webhook signature');
        }
      }

      // Parse the webhook payload
      const event = JSON.parse(req.body.toString());

      // Process webhook with PaymentProcessor
      const transactionData = paymentProcessor.processPayPalWebhook(event);

      // Handle different event types
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" && transactionData) {
        const resource = event.resource;
        const orderId = resource.supplementary_data?.related_ids?.order_id;

        if (orderId) {
          // Find transaction by PayPal order ID
          const transaction = await PaymentRepository.findTransactionByPaypalOrderId(orderId);
          if (transaction) {
            // Update transaction status
            await PaymentRepository.updateTransactionWithPaypalData(
              transaction._id!,
              {
                paypalCaptureId: resource.id,
                status: "completed"
              }
            );
            
            // Update order status
            await OrderRepository.updateOrderStatus(
              transaction.orderId,
              "completed",
              "Payment completed via PayPal webhook"
            );
          }
        }
      }

      res.status(200).send("Webhook received");
    } catch (error) {
      console.error("Error handling PayPal webhook:", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

export default router;
