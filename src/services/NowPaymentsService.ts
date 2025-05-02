import NowPaymentsApi from '@nowpaymentsio/nowpayments-api-js';

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

if (!NOWPAYMENTS_API_KEY) {
  throw new Error('NOWPAYMENTS_API_KEY is not set in environment variables');
}

const nowpayments = new NowPaymentsApi({ apiKey: NOWPAYMENTS_API_KEY });

export class NowPaymentsService {
  /**
   * Create a new payment invoice
   */
  static async createPayment({ price_amount, price_currency, pay_currency, order_id, ipn_callback_url, success_url, cancel_url, ...rest }: {
    price_amount: number;
    price_currency: string;
    pay_currency?: string;
    order_id: string;
    ipn_callback_url: string;
    success_url?: string;
    cancel_url?: string;
    [key: string]: any;
  }) {
    // Use createInvoice for URLs, createPayment for direct payments
    if (success_url || cancel_url) {
      return await nowpayments.createInvoice({
        price_amount,
        price_currency,
        pay_currency,
        order_id,
        ipn_callback_url,
        success_url,
        cancel_url,
        ...rest
      });
    } else {
      return await nowpayments.createPayment({
        price_amount,
        price_currency,
        pay_currency: pay_currency || price_currency,
        order_id,
        ipn_callback_url,
        ...rest
      });
    }
  }

  /**
   * Get payment status by payment_id
   */
  static async getPaymentStatus(payment_id: string) {
    return await nowpayments.getPaymentStatus({ payment_id });
  }

  /**
   * Validate webhook signature (if needed)
   * NowPayments does not require signature validation by default, but you can add extra checks here.
   */
  static validateWebhook(_req: any): boolean {
    // Optionally implement IP or payload validation
    return true;
  }
}
