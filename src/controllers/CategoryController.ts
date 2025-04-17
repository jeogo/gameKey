import { ICategory } from '../models/Category';
import * as CategoryRepository from '../repositories/CategoryRepository';

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<ICategory[]> {
  try {
    return await CategoryRepository.findAllCategories();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string): Promise<ICategory | null> {
  try {
    return await CategoryRepository.findCategoryById(id);
  } catch (error) {
    console.error(`Error getting category with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new category
 */
export async function createCategory(categoryData: {
  name: string;
  description?: string;
}): Promise<ICategory> {
  try {
    return await CategoryRepository.createCategory(categoryData);
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<ICategory>
): Promise<ICategory | null> {
  try {
    return await CategoryRepository.updateCategory(id, categoryData);
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    return await CategoryRepository.deleteCategory(id);
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
}
