/**
 * Order model for MongoDB
 */
interface IOrder {
  _id?: string;                                    // MongoDB document ID
  userId: string;                                  // User ID reference
  productId: string;                               // Product ID reference
  quantity: number;                                // Quantity of products ordered
  unitPrice: number;                               // Unit price at time of purchase
  totalAmount: number;                             // Total amount (quantity * unitPrice)
  type: "purchase" | "preorder";                   // Type of order
  status: "pending" | "completed" | "cancelled";   // Order status
  customerNote?: string;                           // Optional note from customer
  createdAt: Date;                                 // Order creation timestamp
  updatedAt: Date;                                 // Last update timestamp
  completedAt?: Date;                              // When order was completed/fulfilled
  paymentId?: string;

  // Preorder specific fields (only used when type is "preorder")
  preorderConfirmationDate?: Date;                 // Date when preorder was confirmed

  // Status history tracking
  statusHistory: {
    status: "pending" | "completed" | "cancelled";
    timestamp: Date;
    note?: string;
  }[];
}

export { IOrder };
