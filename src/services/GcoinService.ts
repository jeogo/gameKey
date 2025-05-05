import * as UserRepository from '../repositories/UserRepository';
import * as GcoinTransactionRepository from '../repositories/GcoinTransactionRepository';
import * as ReferralRepository from '../repositories/ReferralRepository';
import { IGcoinTransaction } from '../models/GcoinTransaction';

// Constants for referral rewards
const REFERRAL_SIGNUP_REWARD = 50; // GCoins given when a referred user signs up
const REFERRAL_FIRST_PURCHASE_REWARD = 100; // Additional GCoins given when referred user makes first purchase

/**
 * Service to handle GCoin transactions
 */
export class GcoinService {
  /**
   * Add GCoins to a user's account and record the transaction
   * @returns The updated user if successful, null if failed
   */
  static async addGcoins(
    userId: string,
    amount: number,
    type: IGcoinTransaction['type'],
    description: string,
    relatedEntityType?: IGcoinTransaction['relatedEntityType'],
    relatedEntityId?: string
  ) {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive for adding GCoins');
      }

      // Update user balance
      const user = await UserRepository.updateUserGcoinBalance(userId, amount);
      if (!user) {
        throw new Error(`Failed to update GCoin balance for user ${userId}`);
      }

      // Record transaction
      await GcoinTransactionRepository.createTransaction({
        userId,
        amount,
        type,
        description,
        relatedEntityType,
        relatedEntityId
      });

      return user;
    } catch (error) {
      console.error('Error adding GCoins:', error);
      return null;
    }
  }

  /**
   * Deduct GCoins from a user's account and record the transaction
   * @returns The updated user if successful, null if failed or insufficient balance
   */
  static async deductGcoins(
    userId: string,
    amount: number,
    type: IGcoinTransaction['type'],
    description: string,
    relatedEntityType?: IGcoinTransaction['relatedEntityType'],
    relatedEntityId?: string
  ) {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be positive for deducting GCoins');
      }

      // Check if user has sufficient balance
      const user = await UserRepository.findUserById(userId);
      if (!user || user.gcoinBalance < amount) {
        return null; // Insufficient balance
      }

      // Update user balance (deduct by using negative amount)
      const updatedUser = await UserRepository.updateUserGcoinBalance(userId, -amount);
      if (!updatedUser) {
        throw new Error(`Failed to update GCoin balance for user ${userId}`);
      }

      // Record transaction
      await GcoinTransactionRepository.createTransaction({
        userId,
        amount: -amount, // Store as negative for deductions
        type,
        description,
        relatedEntityType,
        relatedEntityId
      });

      return updatedUser;
    } catch (error) {
      console.error('Error deducting GCoins:', error);
      return null;
    }
  }

  /**
   * Purchase GCoins using fiat/crypto payment
   * This is called after a successful payment to add GCoins
   */
  static async purchaseGcoins(
    userId: string,
    amount: number,
    paymentId: string,
    description: string = 'Purchase of GCoins'
  ) {
    return this.addGcoins(
      userId,
      amount,
      'purchase',
      description,
      'payment',
      paymentId
    );
  }

  /**
   * Process referral and add bonus GCoins if applicable
   * @returns true if referral was processed, false otherwise
   */
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<boolean> {
    try {
      // Find the referring user
      const referrer = await UserRepository.findUserByReferralCode(referralCode);
      if (!referrer) {
        return false;
      }

      // Create referral
      const referral = await ReferralRepository.createReferral({
        referrerId: referrer._id!,
        referredId: newUserId,
        gcoinEarned: REFERRAL_SIGNUP_REWARD
      });

      // Add signup reward to referrer
      await this.addGcoins(
        referrer._id!,
        REFERRAL_SIGNUP_REWARD,
        'referral_bonus',
        `Referral bonus for new signup: ${referralCode}`,
        'referral',
        referral._id
      );

      // Update referrer's total earnings
      await UserRepository.updateReferralEarnings(referrer._id!, REFERRAL_SIGNUP_REWARD);

      return true;
    } catch (error) {
      console.error('Error processing referral signup:', error);
      return false;
    }
  }

  /**
   * Process first purchase bonus for referrer
   * @returns true if bonus was added, false otherwise
   */
  static async processReferralPurchaseBonus(userId: string): Promise<boolean> {
    try {
      // Find the referral
      const referral = await ReferralRepository.findReferralByReferredId(userId);
      if (!referral || referral.isFirstPurchase || referral.status !== 'pending') {
        return false;
      }

      // Update referral status
      await ReferralRepository.updateReferralStatus(
        referral._id!,
        'completed',
        true // Mark as first purchase
      );

      // Add purchase bonus to referrer
      await this.addGcoins(
        referral.referrerId,
        REFERRAL_FIRST_PURCHASE_REWARD,
        'referral_bonus',
        `Referral bonus for first purchase by user`,
        'referral',
        referral._id
      );

      // Update referrer's total earnings
      await UserRepository.updateReferralEarnings(referral.referrerId, REFERRAL_FIRST_PURCHASE_REWARD);

      return true;
    } catch (error) {
      console.error('Error processing referral purchase bonus:', error);
      return false;
    }
  }

  /**
   * Get user's GCoin balance
   */
  static async getUserBalance(userId: string): Promise<number> {
    try {
      const user = await UserRepository.findUserById(userId);
      return user ? user.gcoinBalance : 0;
    } catch (error) {
      console.error('Error getting user balance:', error);
      return 0;
    }
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      return await GcoinTransactionRepository.findTransactionsByUserId(userId, page, limit);
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return { transactions: [], total: 0 };
    }
  }
}

export default GcoinService;