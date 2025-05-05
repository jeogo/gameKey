import { Collection, ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IUser } from '../models/User';
import { generateUniqueReferralCode } from '../utils/adminUtils';

// Simple helper function to convert MongoDB _id to string
function mapUser(user: any): IUser | null {
  if (!user) return null;
  return {
    ...user,
    _id: user._id?.toString()
  };
}

export async function findUserByTelegramId(telegramId: number): Promise<IUser | null> {
  await connectToDatabase();
  const collection = getDb().collection('users');
  const user = await collection.findOne({ telegramId });
  return mapUser(user);
}

export async function findUserById(id: string): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const objectId = new ObjectId(id);
    const user = await collection.findOne({ _id: objectId });
    return mapUser(user);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
}

export async function findUserByReferralCode(referralCode: string): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const user = await collection.findOne({ referralCode });
    return mapUser(user);
  } catch (error) {
    console.error('Error finding user by referral code:', error);
    return null;
  }
}

export async function findAllUsers(filter: any = {}): Promise<IUser[]> {
  await connectToDatabase();
  const collection = getDb().collection('users');
  const users = await collection.find(filter).toArray();
  return users.map(user => mapUser(user)).filter((user): user is IUser => user !== null);
}

/**
 * Find all users who have been accepted
 */
export async function findAllAcceptedUsers(): Promise<IUser[]> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const users = await collection.find({ isAccepted: true }).toArray();
    
    return users.map(user => mapUser(user)).filter((user): user is IUser => user !== null);
  } catch (error) {
    console.error('Error finding accepted users:', error);
    return [];
  }
}

export async function createOrUpdateUser(userData: {
  telegramId: number;
  username?: string;
  referrerId?: string;
}): Promise<IUser> {
  await connectToDatabase();
  const collection = getDb().collection('users');
  const now = new Date();
  
  // Check if user already exists
  const existingUser = await collection.findOne({ telegramId: userData.telegramId });
  
  if (existingUser) {
    // Update existing user
    const updateData = {
      ...userData,
      updatedAt: now
    };
    
    const result = await collection.findOneAndUpdate(
      { telegramId: userData.telegramId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    const mappedUser = mapUser(result);
    if (!mappedUser) {
      throw new Error('Failed to update user');
    }
    return mappedUser;
  } else {
    // Create new user with referral code and initial GCoin balance
    const referralCode = await generateUniqueReferralCode();
    
    const newUser = {
      telegramId: userData.telegramId,
      username: userData.username,
      gcoinBalance: 0,
      referralCode,
      referrerId: userData.referrerId,
      totalReferralEarnings: 0,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await collection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId.toString() };
  }
}

export async function updateUserAcceptance(telegramId: number, isAccepted: boolean): Promise<IUser | null> {
  await connectToDatabase();
  const collection = getDb().collection('users');
  
  const result = await collection.findOneAndUpdate(
    { telegramId },
    { $set: { isAccepted, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  
  return mapUser(result);
}

export async function updateUserGcoinBalance(userId: string, amount: number): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const objectId = new ObjectId(userId);
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $inc: { gcoinBalance: amount }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    return mapUser(result);
  } catch (error) {
    console.error('Error updating user GCoin balance:', error);
    return null;
  }
}

export async function updateReferralEarnings(userId: string, amount: number): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const objectId = new ObjectId(userId);
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $inc: { 
          gcoinBalance: amount,
          totalReferralEarnings: amount 
        }, 
        $set: { updatedAt: new Date() } 
      },
      { returnDocument: 'after' }
    );
    
    return mapUser(result);
  } catch (error) {
    console.error('Error updating user referral earnings:', error);
    return null;
  }
}

export async function updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const objectId = new ObjectId(id);
    
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return mapUser(result);
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('users');
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}
