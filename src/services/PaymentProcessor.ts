import { NowPaymentsService } from './NowPaymentsService';
import { IPaymentTransaction } from '../models/PaymentTransaction';

export type PaymentProvider = 'crypto';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface PaymentTransaction extends IPaymentTransaction {}

export interface CreatePaymentOptions {
  amount: number;
  currency: string;
  description?: string;
  pay_currency?: string;
  order_id: string;
  ipn_callback_url: string;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}

export class PaymentProcessor {
  /**
   * Create a new crypto payment (NowPayments)
   */
  public async createPayment(options: CreatePaymentOptions): Promise<PaymentTransaction> {
    try {
      const payment = await NowPaymentsService.createPayment({
        price_amount: options.amount,
        price_currency: options.currency,
        pay_currency: options.pay_currency,
        order_id: options.order_id,
        ipn_callback_url: options.ipn_callback_url,
        success_url: options.success_url,
        cancel_url: options.cancel_url,
        ...options.metadata
      });

      // Type guard: check for error result
      if (!payment || typeof payment !== 'object' || 'message' in payment || 'errors' in payment) {
        throw new Error((payment && (payment as any).message) || 'Unknown error from NowPayments');
      }

      // Use correct fields for invoice or payment
      const payment_id = (payment as any).payment_id;
      const price_amount = (payment as any).price_amount;
      const price_currency = (payment as any).price_currency;
      const payment_status = (payment as any).payment_status;
      const paymentUrl = (payment as any).invoice_url || (payment as any).pay_address || (payment as any).payment_url || '';
      const pay_currency = (payment as any).pay_currency;

      const transaction: PaymentTransaction = {
        paymentProvider: 'crypto',
        orderId: options.order_id,
        userId: options.metadata?.userId || '',
        providerTransactionId: payment_id,
        amount: price_amount,
        currency: price_currency,
        status: this.mapNowPaymentsStatus(payment_status),
        paymentUrl,
        externalId: payment_id,
        cryptoType: pay_currency,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...options.metadata
      };
      return transaction;
    } catch (error) {
      console.error('Error creating payment with NowPayments:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get payment status by NowPayments payment_id
   */
  public async checkPaymentStatus(payment_id: string): Promise<PaymentStatus> {
    try {
      const response = await NowPaymentsService.getPaymentStatus(payment_id);
      if (!response || typeof response !== 'object' || 'message' in response || 'errors' in response) {
        throw new Error((response && (response as any).message) || 'Unknown error from NowPayments');
      }
      return this.mapNowPaymentsStatus((response as any).payment_status);
    } catch (error) {
      console.error(`Error checking payment status for payment ${payment_id}:`, error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Map NowPayments status to our internal status
   */
  private mapNowPaymentsStatus(status: string): PaymentStatus {
    switch (status) {
      case 'finished':
      case 'confirmed':
        return 'completed';
      case 'failed':
      case 'expired':
      case 'refunded':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}

export const paymentProcessor = new PaymentProcessor();
