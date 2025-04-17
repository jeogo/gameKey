/**
 * Notification model for MongoDB
 */
interface INotification {
    _id?: string;               // MongoDB document ID
    title: string;              // Title of the notification
    message: string;            // Content of the notification
    audience: "all" | "specific_users"; // Target audience
    targetUserIds?: number[];   // Telegram IDs for specific users (if audience is "specific_users")
    createdAt: Date;            // Creation timestamp
  }
  
  export { INotification };