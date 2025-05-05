import { ObjectId } from 'mongodb';
import { connectToDatabase, getDb } from '../database/connection';
import { IProduct } from '../models/Product';

// Helper to convert MongoDB _id to string
function mapProduct(product: any): IProduct | null {
  if (!product) return null;
  return {
    ...product,
    _id: product._id?.toString()
  };
}

// Find product by MongoDB ID
export async function findProductById(id: string): Promise<IProduct | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('products');
    const objectId = new ObjectId(id);
    const product = await collection.findOne({ _id: objectId });
    return mapProduct(product);
  } catch (error) {
    console.error('Error finding product by ID:', error);
    return null;
  }
}

// Get products with filter
export async function findProducts(filter: any = {}): Promise<IProduct[]> {
  await connectToDatabase();
  const collection = getDb().collection('products');
  const products = await collection.find(filter).toArray();
  return products.map(p => mapProduct(p)).filter((p): p is IProduct => p !== null);
}

// For backward compatibility - accepts general filters
export async function findAllProducts(filter: any = {}): Promise<IProduct[]> {
  return findProducts(filter);
}

// Create a new product
export async function createProduct(
  productData: Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IProduct> {
  await connectToDatabase();
  const collection = getDb().collection('products');
  const now = new Date();

  const newProduct = {
    ...productData,
    createdAt: now,
    updatedAt: now
  };
  
  const result = await collection.insertOne(newProduct);
  return { ...newProduct, _id: result.insertedId.toString() };
}

// Update product by ID
export async function updateProduct(
  id: string, 
  productData: Partial<IProduct>
): Promise<IProduct | null> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('products');
    const objectId = new ObjectId(id);
    
    const updateData = {
      ...productData,
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
    return mapProduct(result);
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
}

// Delete product by ID
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const collection = getDb().collection('products');
    const objectId = new ObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount === 1;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Find products by category ID
export async function findProductsByCategoryId(categoryId: string): Promise<IProduct[]> {
  await connectToDatabase();
  const collection = getDb().collection('products');
  const products = await collection.find({ category: categoryId }).toArray();
  return products.map(p => mapProduct(p)).filter((p): p is IProduct => p !== null);
}

export interface Product {
  isAvailable: boolean;
  allowPreorder?: boolean;
  preorderNote?: string;
}


