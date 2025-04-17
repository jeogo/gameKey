import express, { Request, Response } from 'express';
import * as CategoryController from '../controllers/CategoryController';

const router = express.Router();

// Get all categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await CategoryController.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response):Promise<any> => {
  try {
    const id = req.params.id;
    const category = await CategoryController.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error(`Error in GET /categories/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve category' });
  }
});

// Create a new category
router.post('/', async (req: Request, res: Response):Promise<any>=> {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = await CategoryController.createCategory({ name, description });
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error in POST /categories:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req: Request, res: Response) :Promise<any>=> {
  try {
    const id = req.params.id;
    const categoryData = req.body;
    
    // Prevent updating critical fields
    delete categoryData._id;
    delete categoryData.createdAt;
    
    const updatedCategory = await CategoryController.updateCategory(id, categoryData);
    
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    console.error(`Error in PUT /categories/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req: Request, res: Response) :Promise<any>=> {
  try {
    const id = req.params.id;
    const result = await CategoryController.deleteCategory(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Category not found or already deleted' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error(`Error in DELETE /categories/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
