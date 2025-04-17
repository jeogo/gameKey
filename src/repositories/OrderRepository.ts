import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IOrder } from '../models/Order';

// Helper to convert MongoDB _id to string
function mapOrder(order: any): IOrder | null {
  if (!order) return null;
  return {
    ...order,
    _id: order._id?.toString()
  };
}

// Find order by MongoDB ID
export async function findOrderById(id: string): Promise<IOrder | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('orders');
    const objectId = new ObjectId(id);
    const order = await collection.findOne({ _id: objectId });
    return mapOrder(order);
  } catch (error) {
    console.error('Error finding order by ID:', error);
    return null;
  }
}

// Get all orders with pagination and filtering
export async function findOrders(filter: any = {}, page = 1, limit = 20): Promise<{ orders: IOrder[], total: number }> {
  await connectToDatabase();
  const collection = getDb().collection('orders');
  
  const skip = (page - 1) * limit;
  const total = await collection.countDocuments(filter);
  
  const orders = await collection.find(filter)
    .sort({ createdAt: -1 }) // Most recent first
    .skip(skip)
    .limit(limit)
    .toArray();
  
  return {
    orders: orders.map(order => mapOrder(order)).filter((order): order is IOrder => order !== null),
    total
  };
}

// Find orders by user ID
export async function findOrdersByUserId(userId: string, page = 1, limit = 20): Promise<{ orders: IOrder[], total: number }> {
  return findOrders({ userId }, page, limit);
}

// Create a new order
export async function createOrder(orderData: {
  userId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  type: IOrder['type'];
  customerNote?: string;
}): Promise<IOrder> {
  await connectToDatabase();
  const collection = getDb().collection('orders');
  const now = new Date();
  
  const totalAmount = orderData.quantity * orderData.unitPrice;
  
  const newOrder = {
    ...orderData,
    totalAmount,
    status: 'pending' as const,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      { status: 'pending' as const, timestamp: now }
    ]
  };
  
  const result = await collection.insertOne(newOrder);
  return { ...newOrder, _id: result.insertedId.toString() };
}

// Update order status
export async function updateOrderStatus(
  id: string, 
  status: IOrder['status'],
  note?: string
): Promise<IOrder | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('orders');
    const objectId = new ObjectId(id);
    const now = new Date();
    
    // Create status history entry
    const statusEntry = { 
      status, 
      timestamp: now,
      note 
    };
    
    const updateData: any = {
      status,
      updatedAt: now
    };
    
    // If completing the order, add completedAt date
    if (status === 'completed') {
      updateData.completedAt = now;
    }
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { 
        $set: updateData,
        $push: { statusHistory: { $each: [statusEntry] } as unknown as any }
      },
      { returnDocument: 'after' }
    );
    
    return mapOrder(result);
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}

// Get sales statistics
export async function getSalesStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{ 
  totalSales: number;
  totalOrders: number;
  productSales: { productId: string, quantity: number, totalAmount: number }[] 
}> {
  await connectToDatabase();
  const collection = getDb().collection('orders');
  
  const matchStage: any = { status: 'completed' };
  
  // Add date filters if provided
  if (startDate || endDate) {
    matchStage.completedAt = {};
    if (startDate) matchStage.completedAt.$gte = startDate;
    if (endDate) matchStage.completedAt.$lte = endDate;
  }
  
  // Get overall stats
  const overallStats = await collection.aggregate([
    { $match: matchStage },
    { $group: {
      _id: null,
      totalSales: { $sum: '$totalAmount' },
      totalOrders: { $sum: 1 }
    }}
  ]).toArray();
  
  // Get stats by product
  const productStats = await collection.aggregate([
    { $match: matchStage },
    { $group: {
      _id: '$productId',
      quantity: { $sum: '$quantity' },
      totalAmount: { $sum: '$totalAmount' }
    }},
    { $project: {
      _id: 0,
      productId: '$_id',
      quantity: 1,
      totalAmount: 1
    }}
  ]).toArray();
  
  return {
    totalSales: overallStats[0]?.totalSales || 0,
    totalOrders: overallStats[0]?.totalOrders || 0,
    productSales: productStats.map(stat => ({
      productId: stat.productId,
      quantity: stat.quantity,
      totalAmount: stat.totalAmount
    }))
  };
}

export function findOrdersByStatus(arg0: string) {
  throw new Error('Function not implemented.');
}
