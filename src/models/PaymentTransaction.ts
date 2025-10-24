/**
 * Payment Transaction model for MongoDB - Simplified and Clear
 */
interface IPaymentTransaction {
  _id?: string; // MongoDB document ID
  orderId: string; // Reference to order
  userId: string; // User who made the payment
  amount: number; // Payment amount
  currency: string; // Currency (USD, etc)
  paymentProvider: string; // Provider (nowpayments, etc)
  status: 'pending' | 'completed' | 'failed' | 'cancelled'; // Payment status

  // Provider transaction details
  externalId: string; // External payment ID
  providerTransactionId?: string; // Provider's transaction ID

  // Crypto payment details
  cryptoType?: string; // Cryptocurrency (BTC, USDT, etc)
  cryptoAddress?: string; // Payment address
  paymentUrl?: string; // Payment URL

  createdAt: Date; // Creation timestamp
}

export { IPaymentTransaction };
