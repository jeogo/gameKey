import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { INotification } from '../models/Notification';

// Helper function to convert MongoDB _id to string
function mapNotification(notification: any): INotification | null {
  if (!notification) return null;
  return {
    ...notification,
    _id: notification._id?.toString()
  };
}

export async function findNotificationById(id: string): Promise<INotification | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('notifications');
    const objectId = new ObjectId(id);
    const notification = await collection.findOne({ _id: objectId });
    return mapNotification(notification);
  } catch (error) {
    console.error('Error finding notification by ID:', error);
    return null;
  }
}

export async function findAllNotifications(): Promise<INotification[]> {
  await connectToDatabase();
  const collection = getDb().collection('notifications');
  const notifications = await collection.find().toArray();
  return notifications.map(notification => mapNotification(notification)).filter((n): n is INotification => n !== null);
}

export async function createNotification(notificationData: Omit<INotification, '_id' | 'createdAt'>): Promise<INotification> {
  await connectToDatabase();
  const collection = getDb().collection('notifications');
  
  const newNotification = {
    ...notificationData,
    createdAt: new Date()
  };
  
  const result = await collection.insertOne(newNotification);
  return { ...newNotification, _id: result.insertedId.toString() };
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('notifications');
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
