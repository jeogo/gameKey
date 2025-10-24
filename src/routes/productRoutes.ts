import express, { Request, Response } from 'express';
import * as ProductController from '../controllers/ProductController';
import {
  handleValidationErrors,
  validateObjectId,
  validateCreateProduct,
  validatePagination,
  successResponse,
  errorResponse,
  sanitizeInput,
} from '../utils/apiValidation';

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products with filtering
 *     description: Retrieve paginated list of products with optional category filtering
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: category
 *         in: query
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         description: Search products by name
 *         schema:
 *           type: string
 *       - name: minPrice
 *         in: query
 *         description: Minimum price filter
 *         schema:
 *           type: number
 *       - name: maxPrice
 *         in: query
 *         description: Maximum price filter
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get('/', validatePagination, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const categoryId = req.query.categoryId as string;
    const isAvailable = req.query.available === 'true';

    const products = await ProductController.getAllProducts({
      categoryId,
      isAvailable: isAvailable ? true : undefined,
    });

    // Apply manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json(
      successResponse(paginatedProducts, {
        page,
        limit,
        total: products.length,
      })
    );
  } catch (error) {
    console.error('Error in GET /products:', error);
    res.status(500).json(errorResponse('Failed to retrieve products', 'FETCH_ERROR'));
  }
});

// Get product by ID
router.get(
  '/:id',
  validateObjectId('id'),
  handleValidationErrors,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const product = await ProductController.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json(errorResponse('Product not found', 'PRODUCT_NOT_FOUND'));
      }

      res.json(successResponse(product));
    } catch (error) {
      console.error(`Error in GET /products/${req.params.id}:`, error);
      res.status(500).json(errorResponse('Failed to retrieve product', 'FETCH_ERROR'));
    }
  }
);
/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     description: Creates a new digital product that can be sold to users.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, categoryId, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Steam Gift Card $50
 *               categoryId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439013
 *               price:
 *                 type: number
 *                 example: 47.99
 *               description:
 *                 type: string
 *                 example: Digital Steam gift card code
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               digitalContent:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["CODE-123-ABC"]
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

// Create a new product
router.post(
  '/',
  validateCreateProduct,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const productData = req.body;

      // Set defaults for optional fields
      const newProduct = await ProductController.createProduct({
        name: productData.name,
        categoryId: productData.categoryId,
        price: productData.price,
        description: productData.description || '',
        isAvailable: productData.isAvailable ?? true,
        digitalContent: productData.digitalContent || [],
      });

      res.status(201).json(successResponse(newProduct));
    } catch (error) {
      console.error('Error in POST /products:', error);
      res.status(500).json(errorResponse('Failed to create product', 'CREATE_ERROR'));
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     description: Updates mutable product fields. Immutable fields like _id and createdAt are ignored.
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
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               digitalContent:
 *                 type: array
 *                 items: { type: string }
 *           example:
 *             name: Steam Gift Card $100
 *             price: 94.99
 *             isAvailable: true
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Update product
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    // Prevent updating critical fields
    delete req.body._id;
    delete req.body.createdAt;

    const updatedProduct = await ProductController.updateProduct(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error in PUT /products/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product
 *     description: Permanently deletes a product if it exists.
 *     parameters:
 *       - $ref: '#/components/parameters/ObjectIdParam'
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Delete product
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const deleted = await ProductController.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(`Error in DELETE /products/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
