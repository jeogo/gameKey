/**
 * User model for MongoDB
 */
interface IUser {
  _id?: string; // MongoDB document ID
  telegramId: number; // Telegram user ID
  username?: string; // Optional Telegram username
  isAccepted: boolean; // Whether the user is accepted/approved in the system
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
}

export { IUser };