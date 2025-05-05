/**
 * Referral model for MongoDB
 */
interface IReferral {
  _id?: string; // MongoDB document ID
  referrerId: string; // User ID who provided the referral
  referredId: string; // User ID who was referred
  gcoinEarned: number; // GCoins earned from this referral
  status: 'pending' | 'completed' | 'cancelled'; // Status of the referral reward
  isFirstPurchase: boolean; // Indicates if this referral completed their first purchase
  createdAt: Date; // When the referral was created
  completedAt?: Date; // When the referral was completed (reward given)
}

export { IReferral };