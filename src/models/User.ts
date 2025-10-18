/**
 * User model for MongoDB - Simplified Basic Data
 */
interface IUser {
  _id?: string; // MongoDB document ID
  telegramId: number; // Telegram user ID
  username?: string; // Optional Telegram username
  firstName?: string; // User's first name
  createdAt: Date; // Account creation timestamp
}

export { IUser };