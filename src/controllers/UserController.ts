import { IUser } from '../models/User';
import * as UserRepository from '../repositories/UserRepository';
import { bot } from '../bot'; // Import the bot instance
import { successResponse, errorResponse, ApiResponse } from '../utils/apiValidation';

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
      // For updates, first get the MongoDB ID
      const user = await UserRepository.findUserByTelegramId(id);
      if (!user || !user._id) {
        return null;
      }
      id = user._id;
    }
    
    // Update using MongoDB ID
    const updatedUser = await UserRepository.updateUser(id, userData);

    return updatedUser;
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new user - Simplified
 */
export async function createUser(userData: {
  telegramId: number;
  firstName?: string;
  username?: string;
}): Promise<IUser> {
  try {
    return await UserRepository.createOrUpdateUser(userData);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(id: string | number): Promise<boolean> {
  try {
    // If number is provided, assume it's a Telegram ID
    if (typeof id === 'number') {
      const user = await UserRepository.findUserByTelegramId(id);
      if (!user || !user._id) {
        return false;
      }
      id = user._id;
    }
    
    return await UserRepository.deleteUser(id);
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
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
