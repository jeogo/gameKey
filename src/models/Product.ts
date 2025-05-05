/**
 * Digital Product model for MongoDB
 */
 interface IProduct {
  additionalInfo: any;
  _id?: string;              // MongoDB document ID
  name: string;              // Name of the product
  description?: string;      // Optional description of the product
  price: number;             // Price of the product (in USD)
  gcoinPrice: number;        // Price in GCoins
  digitalContent: string[];  // Array of "email:password" strings
  categoryId: string;        // Reference to the category ID
  allowPreorder: boolean;    // Whether this product can be pre-ordered
  preorderNote?: string;     // Optional note about pre-orders (e.g., "سيتم التوصيل خلال يومين")
  createdAt: Date;           // Timestamp when the product was created
  updatedAt: Date;           // Timestamp when the product was last updated
  isAvailable: boolean;      // Whether the product is currently available
}

export { IProduct };