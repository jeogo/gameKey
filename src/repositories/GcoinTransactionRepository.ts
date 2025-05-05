import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IGcoinTransaction } from '../models/GcoinTransaction';

// Helper function to convert MongoDB _id to string
function mapTransaction(transaction: any): IGcoinTransaction | null {
  if (!transaction) return null;
  return {
    ...transaction,
    _id: transaction._id?.toString()
  };
}

/**
 * Find transaction by ID
 */
export async function findTransactionById(id: string): Promise<IGcoinTransaction | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('gcoin_transactions');
    const objectId = new ObjectId(id);
    const transaction = await collection.findOne({ _id: objectId });
    return mapTransaction(transaction);
  } catch (error) {
    console.error('Error finding GCoin transaction by ID:', error);
    return null;
  }
}

/**
 * Find all transactions for a user
 */
export async function findTransactionsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
    transactions: IGcoinTransaction[], 
    total: number 
}> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('gcoin_transactions');
    const skip = (page - 1) * limit;
    
    const total = await collection.countDocuments({ userId });
    const transactions = await collection.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return {
      transactions: transactions.map(t => mapTransaction(t)).filter((t): t is IGcoinTransaction => t !== null),
      total
    };
  } catch (error) {
    console.error('Error finding GCoin transactions by user ID:', error);
    return { transactions: [], total: 0 };
  }
}

/**
 * Create a new GCoin transaction
 */
export async function createTransaction(transactionData: Omit<IGcoinTransaction, '_id' | 'createdAt'>): Promise<IGcoinTransaction> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('gcoin_transactions');
    const now = new Date();
    
    const newTransaction = {
      ...transactionData,
      createdAt: now
    };
    
    const result = await collection.insertOne(newTransaction);
    return { ...newTransaction, _id: result.insertedId.toString() };
  } catch (error) {
    console.error('Error creating GCoin transaction:', error);
    throw error;
  }
}

/**
 * Get GCoin balance for a user
 * Double checks by summing all transactions
 */
export async function getUserBalance(userId: string): Promise<number> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('gcoin_transactions');
    
    const result = await collection.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();
    
    return result.length > 0 ? result[0].total : 0;
  } catch (error) {
    console.error('Error calculating user GCoin balance:', error);
    return 0;
  }
}

/**
 * Get GCoin statistics
 */
export async function getGcoinStats(): Promise<{
  totalUsers: number;
  totalGcoinsIssued: number;
  totalGcoinsSpent: number;
  transactionsByType: { [key: string]: { count: number; amount: number } };
}> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('gcoin_transactions');
    
    // Count distinct users with transactions
    const distinctUsers = await collection.distinct('userId');
    const totalUsers = distinctUsers.length;
    
    // Calculate totals by transaction type
    const transactionStats = await collection.aggregate([
      { 
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]).toArray();
    
    let totalGcoinsIssued = 0;
    let totalGcoinsSpent = 0;
    const transactionsByType: { [key: string]: { count: number; amount: number } } = {};
    
    for (const stat of transactionStats) {
      const type = stat._id;
      const count = stat.count;
      const amount = stat.amount;
      
      transactionsByType[type] = { count, amount };
      
      if (amount > 0) {
        totalGcoinsIssued += amount;
      } else {
        totalGcoinsSpent += Math.abs(amount);
      }
    }
    
    return {
      totalUsers,
      totalGcoinsIssued,
      totalGcoinsSpent,
      transactionsByType
    };
  } catch (error) {
    console.error('Error calculating GCoin statistics:', error);
    return {
      totalUsers: 0,
      totalGcoinsIssued: 0,
      totalGcoinsSpent: 0,
      transactionsByType: {}
    };
  }
}