/**
 * Payment Transaction model for MongoDB
 */
interface IPaymentTransaction {
  metadata?: Record<string, any>;
  _id?: string;                          // MongoDB document ID
  orderId: string;                       // Reference to store order
  userId: string;                        // User who made the payment
  paymentProvider: 'paypal' | 'crypto';  // Payment method
  
  // Payment details
  providerTransactionId?: string;        // Transaction ID from provider
  amount: number;                        // Transaction amount
  currency: string;                      // Currency code (USD, EUR, etc)
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'cancelled'; // Payment status
  
  // PayPal specific fields
  paypalOrderId?: string;                // PayPal order ID
  paypalCaptureId?: string;              // PayPal capture ID
  
  // Crypto specific fields
  cryptoType?: string;                   // Allow any cryptocurrency type
  cryptoNetwork?: string;                // Network (e.g., TRC20, ERC20)
  cryptoAddress?: string;                // Wallet address for payment
  cryptoTxHash?: string;                 // Transaction hash on blockchain
  
  // Additional fields
  externalId?: string;                   // External transaction ID
  payerEmail?: string;                   // Payer email address
  paymentUrl?: string;                   // Payment URL
  
  // Timestamps
  createdAt: Date;                       // When transaction was created
  updatedAt: Date;                       // Last update
  completedAt?: Date;                    // When payment completed
}

export { IPaymentTransaction };

