/**
 * GCoin Transaction model for MongoDB
 */
interface IGcoinTransaction {
  _id?: string; // MongoDB document ID
  userId: string; // User ID who owns the transaction
  amount: number; // Amount of GCoins (positive for additions, negative for deductions)
  type: 'purchase' | 'purchase_product' | 'referral_bonus' | 'admin_adjustment' | 'refund'; // Type of transaction
  relatedEntityType?: 'order' | 'payment' | 'referral'; // Type of related entity
  relatedEntityId?: string; // ID of the related entity (order ID, payment ID, etc.)
  description: string; // Description of the transaction
  createdAt: Date; // When the transaction happened
}

export { IGcoinTransaction };