/**
 * Digital Product model for MongoDB - Simplified
 */
interface IProduct {
  _id?: string;              // MongoDB document ID
  name: string;              // Name of the product
  description?: string;      // Optional description
  price: number;             // Price in USD
  categoryId: string;        // Reference to category
  isAvailable: boolean;      // Whether product is available
  
  // Digital content storage (keys, emails, etc.)
  digitalContent: string[];  // Array of product keys/emails/accounts
  
  createdAt: Date;           // Creation timestamp
}

export { IProduct };