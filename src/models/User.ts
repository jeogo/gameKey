/**
 * User model for MongoDB
 */
interface IUser {
  _id?: string; // MongoDB document ID
  telegramId: number; // Telegram user ID
  username?: string; // Optional Telegram username
  // تم حذف isAccepted لأن التسجيل تلقائي
  // GCoin system fields
  gcoinBalance: number; // User's GCoin balance
  referralCode: string; // Unique referral code
  referrerId?: string; // ID of the user who referred this user
  totalReferralEarnings: number; // Total GCoins earned from referrals
  
  createdAt: Date; // Account creation timestamp
  updatedAt: Date; // Last update timestamp
}

export { IUser };