/**
 * Order model for MongoDB - Simplified
 */
interface IOrder {
  _id?: string;                                    // MongoDB document ID
  userId: string;                                  // User ID reference
  productId: string;                               // Product ID reference
  quantity: number;                                // Quantity ordered
  unitPrice: number;                               // Unit price at purchase time
  totalAmount: number;                             // Total amount
  status: "pending" | "paid" | "delivered" | "cancelled";   // Order status
  deliveredContent?: string[];                     // Delivered product keys/content
  createdAt: Date;                                 // Order creation timestamp
}

export { IOrder };
