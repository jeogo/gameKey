import express from 'express';
import { Request, Response } from 'express';
import * as UserController from '../controllers/UserController';

const router = express.Router();

// Get all users - frontend will handle filtering
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get all users without any filtering here
    // Frontend will handle filtering for accepted users
    const users = await UserController.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Get user by MongoDB ID only
router.get('/:id', async (req: Request, res: Response):Promise<any> => {
    try {
      const id = req.params.id;
      const user = await UserController.getUserById(id);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error(`Error in GET /users/${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to retrieve user' });
    }
  });

// General update endpoint for updating any field
router.put('/:id', async (req: Request, res: Response):Promise<any> => {
    try {
      const id = req.params.id;
      const userData = req.body;
      
      // Prevent updating critical fields directly
      delete userData._id;
      delete userData.telegramId;
      delete userData.createdAt;
  
      // Always update the updatedAt timestamp
      userData.updatedAt = new Date();
  
      const updatedUser = await UserController.updateUser(id, userData);
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(updatedUser);
    } catch (error) {
      console.error(`Error in PUT /users/${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

// Update user acceptance status - keeping for backwards compatibility
router.put('/:id/acceptance', async (req: Request, res: Response):Promise<any> => {
  try {
    const id = req.params.id;
    const { isAccepted } = req.body;
    
    if (isAccepted === undefined) {
      return res.status(400).json({ error: 'isAccepted field is required' });
    }
    
    const updatedUser = await UserController.updateUser(id, { isAccepted });
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error(`Error in PUT /users/${req.params.id}/acceptance:`, error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post("/:userId/send-message", async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing message." });
    }
    await UserController.sendMessage(userId, message);
    return res.json({ success: true, message: "Message sent successfully." });
  } catch (error) {
    console.error(`Failed to send message to user ${req.params.userId}:`, error);
    return res.status(404).json({ error: (error as Error).message });
  }
});

export default router;
