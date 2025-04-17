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
