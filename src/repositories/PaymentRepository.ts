import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IPaymentTransaction } from '../models/PaymentTransaction';

// Helper to convert MongoDB _id to string
function mapTransaction(transaction: any): IPaymentTransaction | null {
  if (!transaction) return null;
  return {
    ...transaction,
    _id: transaction._id?.toString()
  };
}

// Create new payment transaction
export async function createTransaction(transactionData: Omit<IPaymentTransaction, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPaymentTransaction> {
  await connectToDatabase();
  const collection = getDb().collection('payment_transactions');
  const now = new Date();
  
  const newTransaction = {
    ...transactionData,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(newTransaction);
  return { ...newTransaction, _id: result.insertedId.toString() };
}

// Find transaction by ID
export async function findTransactionById(id: string): Promise<IPaymentTransaction | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const objectId = new ObjectId(id);
    const transaction = await collection.findOne({ _id: objectId });
    return mapTransaction(transaction);
  } catch (error) {
    console.error('Error finding transaction by ID:', error);
    return null;
  }
}

// Find transaction by external ID
export async function findTransactionByExternalId(externalId: string): Promise<IPaymentTransaction | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const transaction = await collection.findOne({ externalId });
    return mapTransaction(transaction);
  } catch (error) {
    console.error('Error finding transaction by external ID:', error);
    return null;
  }
}

// Find transaction by provider transaction ID (NOWPayments payment_id)
export async function findTransactionByProviderId(providerTransactionId: string): Promise<IPaymentTransaction | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const transaction = await collection.findOne({ providerTransactionId });
    return mapTransaction(transaction);
  } catch (error) {
    console.error('Error finding transaction by provider ID:', error);
    return null;
  }
}

// Update transaction status
export async function updateTransactionStatus(
  id: string,
  status: IPaymentTransaction['status'],
  additionalData: Partial<IPaymentTransaction> = {}
): Promise<IPaymentTransaction | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const objectId = new ObjectId(id);
    const now = new Date();
    
    const updateData: any = {
      status,
      updatedAt: now,
      ...additionalData
    };
    
    // If completing the transaction, add completedAt date
    if (status === 'completed') {
      updateData.completedAt = now;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    // Record status change in history
    await addPaymentStatusHistory(id, status, additionalData.cryptoTxHash ? 
      `Status updated to ${status}. Transaction hash: ${additionalData.cryptoTxHash}` :
      `Status updated to ${status}.`
    );
    
    return mapTransaction(result);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return null;
  }
}

// Find all transactions with pagination
export async function findAllTransactions(
  filter: any = {}, 
  skip = 0, 
  limit = 20
): Promise<IPaymentTransaction[]> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const transactions = await collection.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return transactions.map(t => mapTransaction(t)).filter((t): t is IPaymentTransaction => t !== null);
  } catch (error) {
    console.error('Error finding all transactions:', error);
    return [];
  }
}

// Count transactions for pagination
export async function countTransactions(filter: any = {}): Promise<number> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    return await collection.countDocuments(filter);
  } catch (error) {
    console.error('Error counting transactions:', error);
    return 0;
  }
}

// Find transactions by order ID
export async function findTransactionsByOrderId(orderId: string): Promise<IPaymentTransaction[]> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    const transactions = await collection.find({ orderId }).sort({ createdAt: -1 }).toArray();
    return transactions.map(t => mapTransaction(t)).filter((t): t is IPaymentTransaction => t !== null);
  } catch (error) {
    console.error('Error finding transactions by order ID:', error);
    return [];
  }
}

// Get payment statistics
export async function getPaymentStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  paymentsByMethod: { [key: string]: { count: number, amount: number } };
}> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_transactions');
    
    // Build filter for date range
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }
    
    // Get all transactions within the date range
    const transactions = await collection.find(filter).toArray();
    
    // Calculate statistics
    const stats = {
      totalPayments: transactions.length,
      totalAmount: 0,
      completedPayments: 0,
      completedAmount: 0,
      pendingPayments: 0,
      pendingAmount: 0,
      failedPayments: 0,
      paymentsByMethod: {} as { [key: string]: { count: number, amount: number } }
    };
    
    // Process transactions
    for (const tx of transactions) {
      const amount = tx.amount || 0;
      
      // Add to total
      stats.totalAmount += amount;
      
      // Process by status
      if (tx.status === 'completed') {
        stats.completedPayments++;
        stats.completedAmount += amount;
      } else if (tx.status === 'pending') {
        stats.pendingPayments++;
        stats.pendingAmount += amount;
      } else if (tx.status === 'failed' || tx.status === 'cancelled') {
        stats.failedPayments++;
      }
      
      // Process by payment method
      const method = tx.paymentProvider;
      if (!stats.paymentsByMethod[method]) {
        stats.paymentsByMethod[method] = { count: 0, amount: 0 };
      }
      
      stats.paymentsByMethod[method].count++;
      
      if (tx.status === 'completed') {
        stats.paymentsByMethod[method].amount += amount;
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    return {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      completedAmount: 0,
      pendingPayments: 0,
      pendingAmount: 0,
      failedPayments: 0,
      paymentsByMethod: {}
    };
  }
}

/**
 * Get payment status history for a transaction 
 * This can be used to show payment status timeline/history
 */
export async function addPaymentStatusHistory(
  transactionId: string, 
  status: IPaymentTransaction['status'],
  note?: string
): Promise<void> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('payment_status_history');
    const objectId = new ObjectId(transactionId);
    
    await collection.insertOne({
      transactionId: objectId,
      status,
      note,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error adding payment status history:', error);
  }
}

export async function createFullTransaction(txData: IPaymentTransaction): Promise<IPaymentTransaction> {
  await connectToDatabase();
  const collection = getDb().collection("payment_transactions");
  const now = new Date();
  const { _id, ...txDataWithoutId } = txData;
  const newTx = {
    ...txDataWithoutId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(newTx);
  return { ...newTx, _id: result.insertedId.toString() };
}

export async function updateTransaction(id: string, updates: Partial<IPaymentTransaction>): Promise<IPaymentTransaction | null> {
  await connectToDatabase();
  const collection = getDb().collection("payment_transactions");
  updates.updatedAt = new Date();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: "after" }
  );
  return result?.value ? { ...result.value, _id: result.value._id.toString() } : null;
}
