import { config } from 'dotenv';
import * as UserRepository from '../repositories/UserRepository';

// Load environment variables
config();

/**
 * Utility functions for handling admin-related operations
 */

// Get all admin IDs from environment variable
export function getAdminIds(): number[] {
  const adminIdsString = process.env.ADMIN_IDS || '';
  if (!adminIdsString) return [];
  
  // Split by comma and convert to numbers
  return adminIdsString
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

// Check if a user ID is an admin
export function isAdmin(userId: number): boolean {
  const adminIds = getAdminIds();
  return adminIds.includes(userId);
}

// Get notification recipient IDs
export function getNotificationRecipients(): number[] {
  // Use main notification ID if available
  const notificationId = parseInt(process.env.NOTIFICATION_TELEGRAM_ID || '0', 10);
  
  // Get all admin IDs as fallback or additional recipients
  const adminIds = getAdminIds();
  
  if (notificationId && !adminIds.includes(notificationId)) {
    // Add notification ID to the list if it's not already included
    return [notificationId, ...adminIds];
  }
  
  return adminIds;
}

/**
 * Generate a unique referral code
 * Uses a combination of random alphanumeric characters
 */
export async function generateUniqueReferralCode(length: number = 8): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const maxAttempts = 5;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    let code = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    // Check if the code already exists
    const existingUser = await UserRepository.findUserByReferralCode(code);
    if (!existingUser) {
      return code;
    }
    
    attempts++;
  }
  
  // If we've tried multiple times and still can't get a unique code,
  // add a timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return randomPart + timestamp.substring(0, 4);
}
