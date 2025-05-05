import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IReferral } from '../models/Referral';

// Helper function to convert MongoDB _id to string
function mapReferral(referral: any): IReferral | null {
  if (!referral) return null;
  return {
    ...referral,
    _id: referral._id?.toString()
  };
}

/**
 * Find referral by ID
 */
export async function findReferralById(id: string): Promise<IReferral | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    const objectId = new ObjectId(id);
    const referral = await collection.findOne({ _id: objectId });
    return mapReferral(referral);
  } catch (error) {
    console.error('Error finding referral by ID:', error);
    return null;
  }
}

/**
 * Find all referrals by referrer ID
 */
export async function findReferralsByReferrerId(referrerId: string, page: number = 1, limit: number = 20): Promise<{ referrals: IReferral[], total: number }> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    const skip = (page - 1) * limit;
    
    const total = await collection.countDocuments({ referrerId });
    const referrals = await collection.find({ referrerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return {
      referrals: referrals.map(r => mapReferral(r)).filter((r): r is IReferral => r !== null),
      total
    };
  } catch (error) {
    console.error('Error finding referrals by referrer ID:', error);
    return { referrals: [], total: 0 };
  }
}

/**
 * Create a new referral
 */
export async function createReferral(referralData: {
  referrerId: string;
  referredId: string;
  gcoinEarned: number;
}): Promise<IReferral> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    const now = new Date();
    
    const newReferral = {
      ...referralData,
      status: 'pending' as const,
      isFirstPurchase: false,
      createdAt: now
    };
    
    const result = await collection.insertOne(newReferral);
    return { ...newReferral, _id: result.insertedId.toString() };
  } catch (error) {
    console.error('Error creating referral:', error);
    throw error;
  }
}

/**
 * Update referral status
 */
export async function updateReferralStatus(
  id: string, 
  status: IReferral['status'], 
  isFirstPurchase: boolean = false
): Promise<IReferral | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    const objectId = new ObjectId(id);
    
    const updateData: any = {
      status,
      isFirstPurchase
    };
    
    // If we're completing, add completion date
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return mapReferral(result);
  } catch (error) {
    console.error('Error updating referral status:', error);
    return null;
  }
}

/**
 * Check if a user has been referred
 */
export async function findReferralByReferredId(referredId: string): Promise<IReferral | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    const referral = await collection.findOne({ referredId });
    return mapReferral(referral);
  } catch (error) {
    console.error('Error finding referral by referred ID:', error);
    return null;
  }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(referrerId: string): Promise<{
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  totalGcoinsEarned: number;
}> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('referrals');
    
    const allReferrals = await collection.countDocuments({ referrerId });
    const completedReferrals = await collection.countDocuments({ referrerId, status: 'completed' });
    const pendingReferrals = await collection.countDocuments({ referrerId, status: 'pending' });
    
    // Calculate total GCoins earned from referrals
    const result = await collection.aggregate([
      { $match: { referrerId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$gcoinEarned' } } }
    ]).toArray();
    
    const totalGcoinsEarned = result.length > 0 ? result[0].total : 0;
    
    return {
      totalReferrals: allReferrals,
      completedReferrals,
      pendingReferrals,
      totalGcoinsEarned
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalGcoinsEarned: 0
    };
  }
}