import express, { Request, Response } from 'express';
import * as CategoryController from '../controllers/CategoryController';
import { successResponse, errorResponse } from '../utils/apiValidation';

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all product categories
 *     description: |
 *       Retrieve all product categories with their details.
 *       Categories are used to organize products in the store.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *             example:
 *               success: true
 *               data:
 *                 - _id: "507f1f77bcf86cd799439014"
 *                   name: "Gaming Gift Cards"
 *                   description: "Steam, PlayStation, Xbox gift cards"
 *                   sortOrder: 1
 *                   isActive: true
 *                   createdAt: "2025-10-01T08:00:00Z"
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await CategoryController.getAllCategories();
    res.json(successResponse(categories));
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json(errorResponse('Failed to retrieve categories', 'FETCH_ERROR'));
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get category by ID
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    const category = await CategoryController.getCategoryById(id);

    if (!category) {
      return res.status(404).json(errorResponse('Category not found', 'CATEGORY_NOT_FOUND'));
    }

    res.json(successResponse(category));
  } catch (error) {
    console.error(`Error in GET /categories/${req.params.id}:`, error);
    res.status(500).json(errorResponse('Failed to retrieve category', 'FETCH_ERROR'));
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
// Create a new category
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json(errorResponse('Category name is required', 'MISSING_NAME'));
    }

    const newCategory = await CategoryController.createCategory({ name, description });
    res.status(201).json(successResponse(newCategory));
  } catch (error) {
    console.error('Error in POST /categories:', error);
    res.status(500).json(errorResponse('Failed to create category', 'CREATE_ERROR'));
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Update category
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
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

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete a category
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Delete category
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
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
