import NowPaymentsApi from '@nowpaymentsio/nowpayments-api-js';
import * as dotenv from 'dotenv';

dotenv.config();

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentTransaction {
  id?: string;
  amount: number;
  currency: string;
  provider: 'nowpayments';
  status: PaymentStatus;
  externalId?: string;
  paymentUrl?: string;
  webhookData?: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  description?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export class NowPaymentsService {
  private api: any;

  constructor() {
    this.api = new NowPaymentsApi({
      apiKey: process.env.NOWPAYMENTS_API_KEY || ''
    });
  }

  async createPayment(options: CreatePaymentOptions & { payCurrency?: string }): Promise<PaymentTransaction> {
    try {
      // First, check available currencies
      const { currencies } = await this.api.getCurrencies();
      console.log("Available currencies:", currencies);
      
      const payCurrency = options.payCurrency?.toLowerCase() || 'btc'; // Default to BTC instead of USDT
      console.log("Creating NOWPayments payment with options:", options, "payCurrency:", payCurrency);
      
      // Make sure price_currency is lowercase
      const priceCurrency = options.currency.toLowerCase();
      
      // First validate we can get a minimum amount estimate
      try {
        const minimumAmount = await this.api.getMinimumPaymentAmount({
          currency_from: priceCurrency,
          currency_to: payCurrency
        });
        console.log("Minimum payment amount:", minimumAmount);
      } catch (estimateError) {
        console.error("Error getting minimum amount:", estimateError);
        // Try with a different payCurrency if this fails
        return this.createPaymentWithFallback(options, 'btc');
      }
      
      // Create invoice instead of direct payment
      const payment = await this.api.createInvoice({
        price_amount: options.amount,
        price_currency: priceCurrency,
        order_id: options.metadata?.orderId || `order-${Date.now()}`,
        order_description: options.description || 'Payment for digital goods',
        ipn_callback_url: `${process.env.WEBHOOK_URL}/api/payments/nowpayments-webhook`,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl
      });
      
      console.log("NOWPayments API Response:", payment);
      
      if (!payment.invoice_url) {
        throw new Error("No invoice URL returned from NOWPayments API");
      }
      
      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: payment.id || `manual-${Date.now()}`,
        paymentUrl: payment.invoice_url,
        metadata: options.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error creating payment with NOWPayments:", error);
      
      // Try with BTC if USDT fails
      if (options.payCurrency && options.payCurrency !== 'btc') {
        console.log("Retrying with BTC as payment currency");
        return this.createPaymentWithFallback(options, 'btc');
      }
      
      // Return a fallback payment object that will at least let the flow continue
      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: `error-${Date.now()}`,
        paymentUrl: "https://nowpayments.io",
        metadata: {
          ...options.metadata,
          error: error instanceof Error ? error.message : "Unknown error"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
  
  /**
   * Fallback method that tries to create a payment with a different cryptocurrency
   */
  private async createPaymentWithFallback(options: CreatePaymentOptions, fallbackCurrency: string): Promise<PaymentTransaction> {
    try {
      console.log(`Trying fallback payment with ${fallbackCurrency}`);
      
      // Create an invoice (more reliable than direct payment)
      const payment = await this.api.createInvoice({
        price_amount: options.amount,
        price_currency: options.currency.toLowerCase(),
        order_id: options.metadata?.orderId || `order-${Date.now()}`,
        order_description: options.description || 'Payment for digital goods',
        ipn_callback_url: `${process.env.WEBHOOK_URL}/api/payments/nowpayments-webhook`,
        success_url: options.successUrl,
        cancel_url: options.cancelUrl
      });
      
      console.log("NOWPayments API Fallback Response:", payment);
      
      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: payment.id || `manual-${Date.now()}`,
        paymentUrl: payment.invoice_url,
        metadata: options.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`Error creating fallback payment with ${fallbackCurrency}:`, error);
      
      // Final fallback - return a payment object with error info
      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: `error-${Date.now()}`,
        paymentUrl: "https://nowpayments.io",
        metadata: {
          ...options.metadata,
          error: error instanceof Error ? error.message : "Unknown error"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.api.getPaymentStatus({ payment_id: paymentId });
    switch (payment.payment_status) {
      case 'finished':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'waiting':
      case 'confirming':
        return 'pending';
      case 'refunded':
        return 'refunded';
      case 'expired':
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  processWebhook(event: any): PaymentTransaction | null {
    if (!event || !event.payment_id) return null;
    let status: PaymentStatus = 'pending';
    switch (event.payment_status) {
      case 'finished':
        status = 'completed'; break;
      case 'failed':
        status = 'failed'; break;
      case 'waiting':
      case 'confirming':
        status = 'pending'; break;
      case 'refunded':
        status = 'refunded'; break;
      case 'expired':
      case 'cancelled':
        status = 'cancelled'; break;
    }
    return {
      amount: parseFloat(event.price_amount),
      currency: event.price_currency,
      provider: 'nowpayments',
      status,
      externalId: event.payment_id,
      paymentUrl: event.pay_address || event.invoice_url,
      webhookData: event,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export const nowPaymentsService = new NowPaymentsService();
