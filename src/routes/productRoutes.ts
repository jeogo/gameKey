import express, { Request, Response } from 'express';
import * as ProductController from '../controllers/ProductController';

const router = express.Router();

// Get all products
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await ProductController.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Error in GET /products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) :Promise<any>=> {
  try {
    const product = await ProductController.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error(`Error in GET /products/${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// Create a new product
router.post('/', async (req: Request, res: Response):Promise<any>=> {
  try {
    const { name, categoryId, price, description, isAvailable } = req.body;
    if (!name || !categoryId || typeof price !== 'number' || isAvailable === undefined) {
      return res.status(400).json({ error: 'Missing required product data' });
    }
    const newProduct = await ProductController.createProduct({
        name,
        categoryId,
        price,
        description,
        isAvailable,
        digitalContent: [],
        allowPreorder: false
    });
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error in POST /products:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) :Promise<any>=> {
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

// Delete product
router.delete('/:id', async (req: Request, res: Response) :Promise<any>=> {
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
