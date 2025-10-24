import express from 'express';
import { Request, Response } from 'express';
import * as UserController from '../controllers/UserController';
import {
  handleValidationErrors,
  validateObjectId,
  validateUpdateUser,
  validatePagination,
  successResponse,
  errorResponse,
  sanitizeInput,
} from '../utils/apiValidation';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with pagination
 *     description: Retrieve a paginated list of all users in the system
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: search
 *         in: query
 *         description: Search users by username or name
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', validatePagination, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // For now, get all users (can add pagination to repository later)
    const users = await UserController.getAllUsers();

    // Apply manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json(
      successResponse(paginatedUsers, {
        page,
        limit,
        total: users.length,
      })
    );
  } catch (error) {
    console.error('Error in GET /users:', error);
    res.status(500).json(errorResponse('Failed to retrieve users', 'FETCH_ERROR'));
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their MongoDB Object ID
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get(
  '/:id',
  validateObjectId('id'),
  handleValidationErrors,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const id = req.params.id;
      const user = await UserController.getUserById(id);

      if (!user) {
        return res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      }

      res.json(successResponse(user));
    } catch (error) {
      console.error(`Error in GET /users/${req.params.id}:`, error);
      res.status(500).json(errorResponse('Failed to retrieve user', 'FETCH_ERROR'));
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update a user
 *     description: 'Update mutable user profile fields. Immutable fields like _id, telegramId, createdAt are ignored if provided.'
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: gamer007
 *               firstName:
 *                 type: string
 *                 example: Alex
 *           example:
 *             username: gamer007
 *             firstName: Alex
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// General update endpoint for updating any field
router.put(
  '/:id',
  validateUpdateUser,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<any> => {
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
        return res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      }

      res.json(successResponse(updatedUser));
    } catch (error) {
      console.error(`Error in PUT /users/${req.params.id}:`, error);
      res.status(500).json(errorResponse('Failed to update user', 'UPDATE_ERROR'));
    }
  }
);

// Update user acceptance status - deprecated since registration is now automatic
router.put('/:id/acceptance', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;

    // Since registration is automatic, just return the existing user
    const user = await UserController.getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(`Error in PUT /users/${req.params.id}/acceptance:`, error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * @swagger
 * /users/{userId}/send-message:
 *   post:
 *     tags: [Users]
 *     summary: Send a direct message to a user (admin/bot action)
 *     description: Sends a Telegram message to the specified user. Message length must be 1-4096 characters.
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID (MongoDB Object ID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Message content (1-4096 chars)
 *                 example: Hello! Your order has been processed.
 *     responses:
 *       200:
 *         description: Message queued for sending
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         sent:
 *                           type: boolean
 *                           example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:userId/send-message',
  validateObjectId('userId'),
  handleValidationErrors,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId } = req.params;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res
          .status(400)
          .json(errorResponse('Message is required and cannot be empty', 'INVALID_MESSAGE'));
      }

      if (message.length > 4096) {
        // Telegram message limit
        return res
          .status(400)
          .json(errorResponse('Message too long (max 4096 characters)', 'MESSAGE_TOO_LONG'));
      }

      await UserController.sendMessage(userId, message.trim());
      return res.json(successResponse({ sent: true }, undefined));
    } catch (error) {
      console.error(`Failed to send message to user ${req.params.userId}:`, error);
      return res.status(404).json(errorResponse((error as Error).message, 'SEND_MESSAGE_ERROR'));
    }
  }
);

/**
 * @swagger
 * /users/telegram/{telegramId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by Telegram ID
 *     description: Retrieve a specific user by their Telegram ID
 *     parameters:
 *       - name: telegramId
 *         in: path
 *         required: true
 *         description: Telegram user ID
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/telegram/:telegramId',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const telegramId = parseInt(req.params.telegramId);
      
      if (isNaN(telegramId)) {
        return res.status(400).json(errorResponse('Invalid Telegram ID', 'INVALID_TELEGRAM_ID'));
      }

      const user = await UserController.getUserById(telegramId);

      if (!user) {
        return res.status(404).json(errorResponse('User not found', 'USER_NOT_FOUND'));
      }

      res.json(successResponse(user));
    } catch (error) {
      console.error(`Error getting user by Telegram ID ${req.params.telegramId}:`, error);
      res.status(500).json(errorResponse('Failed to retrieve user', 'FETCH_ERROR'));
    }
  }
);

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - telegramId
 *             properties:
 *               telegramId:
 *                 type: number
 *                 description: Telegram user ID
 *               username:
 *                 type: string
 *                 description: Username
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post(
  '/',
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { telegramId, username, firstName, lastName } = req.body;

      if (!telegramId || typeof telegramId !== 'number') {
        return res.status(400).json(errorResponse('Telegram ID is required and must be a number', 'INVALID_TELEGRAM_ID'));
      }

      const userData = {
        telegramId,
        username: username || '',
        firstName: firstName || '',
        lastName: lastName || ''
      };

      const user = await UserController.createUser(userData);
      res.status(201).json(successResponse(user));
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json(errorResponse('Failed to create user', 'CREATE_USER_ERROR'));
    }
  }
);

export default router;
