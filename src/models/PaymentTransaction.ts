/**
 * Payment Transaction model for MongoDB
 */
interface IPaymentTransaction {
  metadata?: Record<string, any>;
  _id?: string;                          // MongoDB document ID
  orderId: string;                       // Reference to store order
  userId: string;                        // User who made the payment
  paymentProvider: 'crypto';             // Payment method (NowPayments)

  // Payment details
  providerTransactionId?: string;        // NowPayments payment_id
  amount: number;                        // Transaction amount
  currency: string;                      // Currency code (USD, EUR, etc)

  // Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled'; // Payment status

  // Crypto specific fields
  cryptoType?: string;                   // Cryptocurrency type
  cryptoNetwork?: string;                // Network (e.g., TRC20, ERC20)
  cryptoAddress?: string;                // Wallet address for payment
  cryptoTxHash?: string;                 // Transaction hash on blockchain

  // NowPayments specific fields
  paymentUrl?: string;                   // Payment URL
  externalId?: string;                   // External transaction ID (payment_id)

  // Timestamps
  createdAt: Date;                       // When transaction was created
  updatedAt: Date;                       // Last update
  completedAt?: Date;                    // When payment completed
}

export { IPaymentTransaction };

