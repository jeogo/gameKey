import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Payment provider type
export type PaymentProvider = 'nowpayments';

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Interface for payment transaction data
export interface PaymentTransaction {
  id?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  externalId?: string;
  payerEmail?: string;
  paymentUrl?: string;
  webhookData?: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Payment creation options interface
export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}
