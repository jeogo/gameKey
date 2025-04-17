import { INotification } from '../models/Notification';
import * as NotificationRepository from '../repositories/NotificationRepository';
import * as UserRepository from '../repositories/UserRepository';
import { bot } from '../bot';

/**
 * Get all notifications
 */
export async function getAllNotifications(): Promise<INotification[]> {
  try {
    return await NotificationRepository.findAllNotifications();
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: string): Promise<INotification | null> {
  try {
    return await NotificationRepository.findNotificationById(id);
  } catch (error) {
    console.error(`Error getting notification with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new notification and send it to Telegram users
 */
export async function createNotification(data: {
  title: string;
  message: string;
  audience: "all" | "specific_users";
  targetUserIds?: number[];
}): Promise<INotification> {
  try {
    // Validate data
    if (data.audience === "specific_users" && (!data.targetUserIds || data.targetUserIds.length === 0)) {
      throw new Error("Target user IDs are required for specific_users audience");
    }

    // Create notification in database
    const notification = await NotificationRepository.createNotification(data);
    
    // Send notification to Telegram users
    await sendTelegramNotification(data);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Send notification to Telegram users
 */
async function sendTelegramNotification(notificationData: {
  title: string;
  message: string;
  audience: "all" | "specific_users";
  targetUserIds?: number[];
}): Promise<void> {
  try {
    const { title, message, audience, targetUserIds } = notificationData;
    
    // Format notification message
    const formattedMessage = `
📢 *${title}*

${message}
`;

    // Determine which users should receive the notification
    let userIds: number[] = [];
    
    if (audience === "all") {
      // Get all accepted users
      const users = await UserRepository.findAllAcceptedUsers();
      userIds = users.map(user => user.telegramId);
    } else if (audience === "specific_users" && targetUserIds) {
      userIds = targetUserIds;
    }
    
    // Send notification to each user
    const sendPromises = userIds.map(async (userId) => {
      try {
        await bot.api.sendMessage(userId, formattedMessage, {
          parse_mode: "Markdown"
        });
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        // Continue with other users even if one fails
      }
    });
    
    await Promise.all(sendPromises);
    
  } catch (error) {
    console.error('Error sending Telegram notifications:', error);
    // Don't throw here to prevent the API from returning an error
    // We've already created the notification in the database
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  try {
    return await NotificationRepository.deleteNotification(id);
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    throw error;
  }
}
