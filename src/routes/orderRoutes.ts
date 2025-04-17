import express, { Request, Response } from "express";
import * as OrderController from "../controllers/OrderController";

const router = express.Router();

// Get all orders with pagination and filtering
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    // Get filter from query params
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const result = await OrderController.getOrders(filter, page, limit);

    res.json(result);
  } catch (error) {
    console.error("Error in GET /orders:", error);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

// Get orders for a specific user
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await OrderController.getUserOrders(userId, page, limit);
    res.json(result);
  } catch (error) {
    console.error(`Error in GET /orders/user/${req.params.userId}:`, error);
    res.status(500).json({ error: "Failed to retrieve user orders" });
  }
});

// Get order by ID
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const order = await OrderController.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(`Error in GET /orders/${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to retrieve order" });
  }
});

// Create a new order
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, productId, quantity, type, customerNote } = req.body;

    if (!userId || !productId || !quantity || !type) {
      return res.status(400).json({ error: "Missing required order data" });
    }

    const newOrder = await OrderController.createOrder({
      userId,
      productId,
      quantity: parseInt(quantity),
      type,
      customerNote,
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error in POST /orders:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Update order status
router.patch(
  "/:id/status",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedOrder = await OrderController.updateOrderStatus(
        id,
        status,
        note
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error(`Error in PATCH /orders/${req.params.id}/status:`, error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

router.put("/:id/status", async (req: Request, res: Response) :Promise<any>=> {
  try {
    const id = req.params.id;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const updatedOrder = await OrderController.updateOrderStatus(id, status, note);

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error in PUT /orders/${req.params.id}/status:`, error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Fulfill order with digital content
router.post("/:id/fulfill", async (req: Request, res: Response) :Promise<any>=> {
  try {
    const orderId = req.params.id;
    
    // Accept both 'content' and 'digitalContent' field names
    const content = req.body.content || req.body.digitalContent;
    const { note } = req.body;
    
    // Log the received request body for debugging
    console.log("Fulfillment request received:", JSON.stringify(req.body));

    // More detailed validation with helpful error message
    if (!content) {
      console.error("Fulfillment request missing content field:", req.body);
      return res.status(400).json({ 
        error: "Missing digital content", 
        details: "Either 'content' or 'digitalContent' field is required in the request body. It should contain the digital items to deliver to the customer."
      });
    }

    const fulfilledOrder = await OrderController.fulfillOrder(orderId, content, note);
    if (!fulfilledOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(fulfilledOrder);
  } catch (error) {
    console.error(`Error in POST /orders/${req.params.id}/fulfill:`, error);
    res.status(500).json({ 
      error: "Failed to fulfill order", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Sync order statuses with payments (admin function)
router.post("/sync-statuses", async (req: Request, res: Response) => {
  try {
    // Check for admin auth token/header here in a real implementation
    
    const result = await OrderController.syncOrderStatusWithPayments();
    res.json({ 
      success: true, 
      message: `Updated ${result.updated} orders. Encountered ${result.errors} errors.` 
    });
  } catch (error) {
    console.error("Error in POST /orders/sync-statuses:", error);
    res.status(500).json({ error: "Failed to sync order statuses" });
  }
});

// Get sales statistics
router.get("/stats/sales", async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await OrderController.getSalesStatistics(startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error("Error in GET /orders/stats/sales:", error);
    res.status(500).json({ error: "Failed to retrieve sales statistics" });
  }
});

export default router;
