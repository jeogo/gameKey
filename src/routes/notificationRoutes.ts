import express, { Request, Response } from 'express';
import * as NotificationController from '../controllers/NotificationController';

const router = express.Router();

// Get all notifications
router.get('/', async (_req: Request, res: Response) => {
  try {
    const notifications = await NotificationController.getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error('Error in GET /notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

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

// Create a new notification
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, message, audience, targetUserIds } = req.body;
    
    if (!title || !message || !audience) {
      return res.status(400).json({ error: 'Missing required notification data' });
    }
    
    if (audience === 'specific_users' && (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0)) {
      return res.status(400).json({ error: 'Target user IDs are required for specific users' });
    }
    
    const newNotification = await NotificationController.createNotification({
      title,
      message,
      audience,
      targetUserIds: audience === 'specific_users' ? targetUserIds : undefined
    });
    
    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error in POST /notifications:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

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
