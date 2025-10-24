import express, { Request, Response } from 'express';
import * as NotificationController from '../controllers/NotificationController';

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user notifications
 *     description: |
 *       Retrieve list of notifications for users.
 *
 *       **Notification Types:**
 *       - `order` - Order status updates
 *       - `payment` - Payment confirmations
 *       - `system` - System announcements
 *     parameters:
 *       - name: userId
 *         in: query
 *         description: Filter by user ID
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *       - name: type
 *         in: query
 *         description: Filter by notification type
 *         schema:
 *           type: string
 *           enum: [order, payment, system]
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                     $ref: '#/components/schemas/Notification'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439020"
 *                   userId: "507f1f77bcf86cd799439011"
 *                   type: "order"
 *                   title: "Order Delivered"
 *                   message: "Your Steam Gift Card has been delivered!"
 *                   isRead: false
 *                   createdAt: "2025-10-02T12:30:00Z"
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const notifications = await NotificationController.getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Error in GET /notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification by ID
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       200:
 *         description: Notification found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get notification by ID
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const notification = await NotificationController.getNotificationById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error(`Error in GET /notifications/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve notification' });
  }
});

/**
 * @swagger
 * /notifications:
 *   post:
 *     tags: [Notifications]
 *     summary: Create a notification (admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, audience]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               audience:
 *                 type: string
 *                 enum: [all_users, active_users, specific_users]
 *               targetUserIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       201:
 *         description: Notification created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
// Create a new notification
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, message, audience, targetUserIds } = req.body;

    if (!title || !message || !audience) {
      return res.status(400).json({ error: 'Missing required notification data' });
    }

    if (
      audience === 'specific_users' &&
      (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0)
    ) {
      return res.status(400).json({ error: 'Target user IDs are required for specific users' });
    }

    const newNotification = await NotificationController.createNotification({
      title,
      message,
      audience,
      targetUserIds: audience === 'specific_users' ? targetUserIds : undefined,
    });

    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error in POST /notifications:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       204:
 *         description: Notification deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Delete notification
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const result = await NotificationController.deleteNotification(id);

    if (!result) {
      return res.status(404).json({ error: 'Notification not found or already deleted' });
    }

    res.status(204).send();
  } catch (error) {
    console.error(`Error in DELETE /notifications/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;
