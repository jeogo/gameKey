import { IUser } from '../models/User';
import * as UserRepository from '../repositories/UserRepository';
import { bot } from '../bot'; // Import the bot instance

/**
 * Get all users - with optional filtering
 */
export async function getAllUsers(filter: any = {}): Promise<IUser[]> {
  try {
    return await UserRepository.findAllUsers(filter);
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

/**
 * Get user by ID - supports both MongoDB ID and Telegram ID
 */
export async function getUserById(id: string | number): Promise<IUser | null> {
  try {
    // If number is provided, assume it's a Telegram ID
    if (typeof id === 'number') {
      return await UserRepository.findUserByTelegramId(id);
    } 
    // Otherwise use MongoDB ID
    return await UserRepository.findUserById(id);
  } catch (error) {
    console.error(`Error getting user with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(
  id: string | number, 
  userData: Partial<IUser>
): Promise<IUser | null> {
  try {
    // If using Telegram ID
    if (typeof id === 'number') {
      // Special case for acceptance update
      if (userData.isAccepted !== undefined) {
        return await UserRepository.updateUserAcceptance(id, userData.isAccepted);
      }
      
      // For other updates, first get the MongoDB ID
      const user = await UserRepository.findUserByTelegramId(id);
      if (!user || !user._id) {
        return null;
      }
      id = user._id;
    }
    
    // Update using MongoDB ID
    const updatedUser = await UserRepository.updateUser(id, userData);

    // If acceptance status changed, send Telegram notification
    if (updatedUser && typeof userData.isAccepted === 'boolean') {
      const telegramId = typeof id === 'number' ? id : updatedUser.telegramId;
      
      if (userData.isAccepted) {
        // User approved - send approval message
        (updatedUser as any).systemMessage = "Your request has been accepted. You can use the bot now. Just type /start to begin.";
        
        // Send Telegram message
        try {
          await bot.api.sendMessage(
            telegramId, 
            "🎉 *Your request has been accepted!* 🎉\n\n" + 
            "You can now use the bot and access all features.\n\n" +
            "Just type /start to begin shopping in our digital store.",
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          console.error(`Failed to send approval notification to user ${telegramId}:`, error);
        }
      } else {
        // User declined - send rejection message
        (updatedUser as any).systemMessage = "Your account request has been declined.";
        
        // Send Telegram message
        try {
          await bot.api.sendMessage(
            telegramId, 
            "❌ *Registration Declined*\n\nWe're sorry, but your registration request has been declined. " +
            "If you believe this is an error, please contact our support.",
            { parse_mode: "Markdown" }
          );
        } catch (error) {
          console.error(`Failed to send rejection notification to user ${telegramId}:`, error);
        }
      }
    }

    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

export async function sendMessage(userId: string, text: string): Promise<void> {
  const numericId = parseInt(userId, 10);
  const user = await UserRepository.findUserByTelegramId(numericId);
  if (!user) {
    throw new Error(`User with Telegram ID ${userId} not found.`);
  }
  await bot.api.sendMessage(numericId, text);
}
