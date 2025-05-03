import express, { Request, Response } from "express";
import { nowPaymentsService } from "../services/NowPaymentsService";
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

// NOWPayments Return URLs
router.get("/nowpayments-return", async (req: Request, res: Response) => {
  try {
    const transactionId = req.query.txId as string;
    if (transactionId) {
      await PaymentController.nowpaymentsSuccess(req, res);
    } else {
      res.status(200).send('Payment completed! You can close this window and return to the bot.');
    }
  } catch (error) {
    console.error("Error handling NOWPayments return:", error);
    res.status(500).send("Error processing payment return");
  }
});

router.get("/nowpayments-cancel", async (req: Request, res: Response) => {
  try {
    res.status(200).send('Payment was cancelled. You can close this window and return to the bot.');
  } catch (error) {
    console.error("Error handling NOWPayments cancel:", error);
    res.status(500).send("Error processing payment cancellation");
  }
});

// Add NOWPayments webhook endpoint
router.post(
  "/nowpayments-webhook",
  express.json(),
  async (req: Request, res: Response): Promise<any> => {
    try {
      console.log("NOWPayments webhook received:", req.body);
      const event = req.body;
      
      if (!event || !event.payment_id) {
        console.log("Invalid webhook payload:", event);
        return res.status(400).send("Invalid webhook payload");
      }
      
      const transactionData = nowPaymentsService.processWebhook(event);
      if (!transactionData) {
        return res.status(400).send("Could not process webhook data");
      }
      
      // Find existing transaction by external ID
      const existingTx = await PaymentRepository.findTransactionByExternalId(event.payment_id);
      
      if (existingTx) {
        // Update transaction status
        await PaymentRepository.updateTransactionStatus(existingTx._id!, transactionData.status, {
          webhookData: event
        });
        
        // Handle payment completion
        if (transactionData.status === 'completed') {
          const { handlePaymentSuccess } = require('../bot/handlers/paymentHandlers');
          await handlePaymentSuccess(existingTx._id!);
        }
      } else {
        console.log("Transaction not found for payment_id:", event.payment_id);
      }
      
      res.status(200).send("Webhook processed successfully");
    } catch (error) {
      console.error("Error handling NOWPayments webhook:", error);
      res.status(500).send("Error processing webhook");
    }
  }
);

export default router;
