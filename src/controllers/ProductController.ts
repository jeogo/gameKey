import { IProduct } from '../models/Product';
import * as ProductRepository from '../repositories/ProductRepository';

/**
 * Get all products with optional filtering
 */
export async function getAllProducts(filter: any = {}): Promise<IProduct[]> {
  try {
    return await ProductRepository.findAllProducts(filter);
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<IProduct | null> {
  try {
    return await ProductRepository.findProductById(id);
  } catch (error) {
    console.error(`Error getting product with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new product - Simplified
 */
export async function createProduct(data: {
  name: string;
  categoryId: string;
  price: number;
  description?: string;
  isAvailable: boolean;
  digitalContent: string[];
}): Promise<IProduct> {
  try {
    return await ProductRepository.createProduct(data);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update product
 */
export async function updateProduct(
  id: string, 
  productData: Partial<IProduct>
): Promise<IProduct | null> {
  try {
    return await ProductRepository.updateProduct(id, productData);
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

/**
 * Delete product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    return await ProductRepository.deleteProduct(id);
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}