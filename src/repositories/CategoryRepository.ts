import {  ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { ICategory } from '../models/Category';

// Helper function to convert MongoDB _id to string
function mapCategory(category: any): ICategory | null {
  if (!category) return null;
  return {
    ...category,
    _id: category._id?.toString()
  };
}

export async function findCategoryById(id: string): Promise<ICategory | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('categories');
    const objectId = new ObjectId(id);
    const category = await collection.findOne({ _id: objectId });
    return mapCategory(category);
  } catch (error) {
    console.error('Error finding category by ID:', error);
    return null;
  }
}

export async function findAllCategories(): Promise<ICategory[]> {
  await connectToDatabase();
  const collection = getDb().collection('categories');
  const categories = await collection.find().toArray();
  return categories.map(category => mapCategory(category)).filter((category): category is ICategory => category !== null);
}

export async function createCategory(categoryData: Omit<ICategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<ICategory> {
  await connectToDatabase();
  const collection = getDb().collection('categories');
  const now = new Date();
  
  const newCategory = {
    ...categoryData,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(newCategory);
  return { ...newCategory, _id: result.insertedId.toString() };
}

export async function updateCategory(id: string, categoryData: Partial<ICategory>): Promise<ICategory | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('categories');
    const objectId = new ObjectId(id);
    
    const updateData = {
      ...categoryData,
      updatedAt: new Date()
    };
    
    // Prevent updating critical fields
    delete updateData._id;
    delete updateData.createdAt;
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return mapCategory(result);
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('categories');
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
}
