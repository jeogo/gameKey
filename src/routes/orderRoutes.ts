import express, { Request, Response } from 'express';
import * as OrderController from '../controllers/OrderController';

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders with filtering
 *     description: |
 *       Retrieve paginated list of orders with optional filtering.
 *
 *       **Order Statuses:**
 *       - `pending` - Order created, awaiting payment
 *       - `paid` - Payment confirmed, processing order
 *       - `delivered` - Digital content delivered to user
 *       - `cancelled` - Order cancelled
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         schema:
 *           type: integer
 *           example: 20
 *       - name: status
 *         in: query
 *         description: Filter by order status
 *         schema:
 *           type: string
 *           enum: [pending, paid, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439016"
 *                   userId: "507f1f77bcf86cd799439011"
 *                   productId: "507f1f77bcf86cd799439013"
 *                   quantity: 1
 *                   totalAmount: 49.99
 *                   status: "delivered"
 *                   paymentMethod: "crypto"
 *                   deliveredContent: ["STEAM-KEY-ABC123"]
 *                   createdAt: "2025-10-01T10:00:00Z"
 */
router.get('/', async (req: Request, res: Response) => {
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
    console.error('Error in GET /orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

/**
 * @swagger
 * /orders/user/{userId}:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders for a specific user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           example: 20
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: number
 *                   description: Total number of orders for this user
 */
// Get orders for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await OrderController.getUserOrders(userId, page, limit);
    res.json(result);
  } catch (error) {
    console.error(`Error in GET /orders/user/${req.params.userId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve user orders' });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get order by ID
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const order = await OrderController.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(`Error in GET /orders/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, productId, quantity]
 *             properties:
 *               userId:
 *                 type: string
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
// Create a new order
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: 'Missing required order data' });
    }

    const newOrder = await OrderController.createOrder({
      userId,
      productId,
      quantity: parseInt(quantity),
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error in POST /orders:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     tags: [Orders]
 *     summary: Update order status
 *     description: 'Update the status of an existing order. Valid statuses are pending, paid, delivered, cancelled.'
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, delivered, cancelled]
 *                 example: delivered
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Update order status
router.patch('/:id/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedOrder = await OrderController.updateOrderStatus(id, status);

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error in PATCH /orders/${req.params.id}/status:`, error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Replace order status (idempotent)
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/:id/status', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedOrder = await OrderController.updateOrderStatus(id, status);

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error(`Error in PUT /orders/${req.params.id}/status:`, error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * @swagger
 * /orders/{id}/fulfill:
 *   post:
 *     tags: [Orders]
 *     summary: Fulfill order with digital content
 *     description: 'Attach and deliver digital content to the order, setting its status to delivered.'
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["STEAM-KEY-ABC123", "STEAM-KEY-XYZ987"]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order fulfilled and content delivered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Fulfill order with digital content
router.post('/:id/fulfill', async (req: Request, res: Response): Promise<any> => {
  try {
    const orderId = req.params.id;

    // Accept both 'content' and 'digitalContent' field names
    const content = req.body.content || req.body.digitalContent;

    // Log the received request body for debugging
    console.log('Fulfillment request received:', JSON.stringify(req.body));

    // More detailed validation with helpful error message
    if (!content) {
      console.error('Fulfillment request missing content field:', req.body);
      return res.status(400).json({
        error: 'Missing digital content',
        details:
          "Either 'content' or 'digitalContent' field is required in the request body. It should contain the digital items to deliver to the customer.",
      });
    }

    const fulfilledOrder = await OrderController.fulfillOrder(orderId, content);
    if (!fulfilledOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(fulfilledOrder);
  } catch (error) {
    console.error(`Error in POST /orders/${req.params.id}/fulfill:`, error);
    res.status(500).json({
      error: 'Failed to fulfill order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /orders/sync-statuses:
 *   post:
 *     tags: [Orders]
 *     summary: Sync order statuses with payment transactions
 *     description: 'Admin operation to reconcile order statuses based on related payment transactions.'
 *     responses:
 *       200:
 *         description: Sync summary returned
 */
// Sync order statuses with payments (admin function)
router.post('/sync-statuses', async (req: Request, res: Response) => {
  try {
    // Check for admin auth token/header here in a real implementation

    const result = await OrderController.syncOrderStatusWithPayments();
    res.json({
      success: true,
      message: `Updated ${result.updated} orders. Encountered ${result.errors} errors.`,
    });
  } catch (error) {
    console.error('Error in POST /orders/sync-statuses:', error);
    res.status(500).json({ error: 'Failed to sync order statuses' });
  }
});

/**
 * @swagger
 * /orders/stats/sales:
 *   get:
 *     tags: [Orders]
 *     summary: Get sales statistics
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Sales statistics returned
 */
// Get sales statistics
router.get('/stats/sales', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const stats = await OrderController.getSalesStatistics(startDate, endDate);
    res.json(stats);
  } catch (error) {
    console.error('Error in GET /orders/stats/sales:', error);
    res.status(500).json({ error: 'Failed to retrieve sales statistics' });
  }
});

export default router;
