import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Payment provider type - only PayPal
export type PaymentProvider = 'paypal';

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

// Interface for payment transaction data
export interface PaymentTransaction {
  id?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  externalId?: string; // PayPal order ID or capture ID
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

// PayPal specific options
export interface PaypalOptions {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
}

/**
 * PaymentProcessor - A standalone PayPal payment processing service
 */
export class PaymentProcessor {
  private paypalOptions: PaypalOptions;
  private paypalBaseUrl: string;
  private paypalAccessToken: string | null = null;
  private paypalTokenExpiry: Date | null = null;

  /**
   * Initialize the payment processor
   */
  constructor() {
    // Initialize PayPal options
    this.paypalOptions = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      environment: (process.env.PAYPAL_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
    };

    // Use the correct base URL
    this.paypalBaseUrl =
      this.paypalOptions.environment === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    // Validate required environment variables
    this.validateConfig();
  }

  /**
   * Validate that all required config is present
   */
  private validateConfig(): void {
    if (!this.paypalOptions.clientId || !this.paypalOptions.clientSecret) {
      console.warn('PayPal configuration is incomplete. PayPal payments will not work.');
    }
  }

  /**
   * Create a new payment
   */
  public async createPayment(options: CreatePaymentOptions): Promise<PaymentTransaction> {
    try {
      return await this.createPayPalPayment(options);
    } catch (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a PayPal payment
   */
  private async createPayPalPayment(options: CreatePaymentOptions): Promise<PaymentTransaction> {
    try {
      // Get PayPal access token
      await this.getPayPalAccessToken();

      // Create the PayPal order
      const response = await axios({
        method: 'POST',
        url: `${this.paypalBaseUrl}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.paypalAccessToken}`
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: options.currency.toUpperCase(),
              value: options.amount.toFixed(2)
            },
            description: options.description || 'Payment for digital goods'
          }],
          application_context: {
            brand_name: 'Telegram Store',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: options.successUrl || `${process.env.WEBHOOK_URL}/payment/success`,
            cancel_url: options.cancelUrl || `${process.env.WEBHOOK_URL}/payment/cancel`
          }
        }
      });

      const paypalOrderData = response.data;
      let approveUrl = '';

      // Extract the approval URL
      for (const link of paypalOrderData.links) {
        if (link.rel === 'approve') {
          approveUrl = link.href;
          break;
        }
      }

      // Create transaction record
      const transaction: PaymentTransaction = {
        amount: options.amount,
        currency: options.currency,
        provider: 'paypal',
        status: 'pending',
        externalId: paypalOrderData.id,
        paymentUrl: approveUrl,
        metadata: {
          ...options.metadata,
          paypalOrderId: paypalOrderData.id
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return transaction;
    } catch (error) {
      console.error('Error creating PayPal payment:', error);
      throw new Error(`Failed to create PayPal payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PayPal access token
   */
  private async getPayPalAccessToken(): Promise<string> {
    // If we already have a token and it's not expired, reuse it
    if (
      this.paypalAccessToken &&
      this.paypalTokenExpiry &&
      new Date() < this.paypalTokenExpiry
    ) {
      // Token is guaranteed to be non-null at this point
      return this.paypalAccessToken as string;
    }

    try {
      const tokenUrl = `${this.paypalBaseUrl}/v1/oauth2/token`;
      const clientId = process.env.PAYPAL_CLIENT_ID;
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error("PayPal client credentials not set in environment variables");
      }

      const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

      const response = await axios.post(
        tokenUrl,
        "grant_type=client_credentials",
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authString}`
          },
          timeout: 5000
        }
      );

      this.paypalAccessToken = response.data.access_token;
      // Use expires_in minus a buffer (e.g., 60s) to avoid edge cases
      const expiresIn = parseInt(response.data.expires_in, 10) || 3000;
      this.paypalTokenExpiry = new Date(Date.now() + (expiresIn * 1000) - 60000);

      if (!this.paypalAccessToken) {
        throw new Error("Failed to obtain PayPal access token");
      }
      return this.paypalAccessToken;
    } catch (error) {
      console.error("Error fetching PayPal access token:", error);
      throw error;
    }
  }

  /**
   * Verify PayPal payment webhook
   */
  public verifyPaypalWebhook(headers: Record<string, string>, body: any): boolean {
    // Implementation would depend on PayPal webhook verification requirements
    // This is a simplified version
    if (!process.env.PAYPAL_WEBHOOK_ID) {
      console.warn('PayPal webhook ID not configured. Cannot verify webhook.');
      return false;
    }

    try {
      // Verify the webhook signature
      // In a real implementation, you'd use PayPal's SDK to verify the webhook signature
      return true;
    } catch (error) {
      console.error('Failed to verify PayPal webhook:', error);
      return false;
    }
  }

  /**
   * Process PayPal webhook event
   */
  public processPayPalWebhook(event: any): PaymentTransaction | null {
    try {
      if (event.event_type !== 'CHECKOUT.ORDER.APPROVED' &&
          event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
        // This webhook isn't for a completed payment
        return null;
      }

      let status: PaymentStatus = 'pending';
      let externalId = '';
      let amount = 0;
      let currency = 'USD';
      
      // Extract payment data based on event type
      if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
        const order = event.resource;
        externalId = order.id;
        status = 'pending'; // Order approved but not captured yet
        
        if (order.purchase_units && order.purchase_units.length > 0) {
          const unit = order.purchase_units[0];
          amount = parseFloat(unit.amount.value);
          currency = unit.amount.currency_code;
        }
      } else if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const capture = event.resource;
        externalId = capture.id;
        status = capture.status === 'COMPLETED' ? 'completed' : 'pending';
        
        amount = parseFloat(capture.amount.value);
        currency = capture.amount.currency_code;
      }

      // Create a transaction object from the webhook data
      const transaction: PaymentTransaction = {
        amount,
        currency: currency.toLowerCase(),
        provider: 'paypal',
        status,
        externalId,
        metadata: {
          paypalOrderId: externalId,
          webhookEvent: event.event_type
        },
        webhookData: event,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return transaction;
    } catch (error) {
      console.error('Error processing PayPal webhook:', error);
      return null;
    }
  }

  /**
   * Check status of a PayPal payment
   */
  public async checkPayPalPaymentStatus(paypalOrderId: string): Promise<PaymentStatus> {
    try {
      await this.getPayPalAccessToken();

      const response = await axios({
        method: 'GET',
        url: `${this.paypalBaseUrl}/v2/checkout/orders/${paypalOrderId}`,
        headers: {
          'Authorization': `Bearer ${this.paypalAccessToken}`
        }
      });

      const order = response.data;

      // Map PayPal status to our status
      switch (order.status) {
        case 'COMPLETED':
          return 'completed';
        case 'APPROVED':
          return 'pending'; // Approved but not captured yet
        case 'VOIDED':
        case 'PAYER_ACTION_REQUIRED':
          return 'failed';
        default:
          return 'pending';
      }
    } catch (error) {
      console.error(`Error checking PayPal payment status for order ${paypalOrderId}:`, error);
      throw new Error('Failed to check PayPal payment status');
    }
  }

  /**
   * Capture an authorized PayPal payment
   */
  public async capturePayPalPayment(orderId: string): Promise<PaymentTransaction> {
    try {
      await this.getPayPalAccessToken();
      
      const response = await axios({
        method: 'POST',
        url: `${this.paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.paypalAccessToken}`
        }
      });

      const captureData = response.data;
      
      // Get the first capture from the first purchase unit
      const capture = captureData.purchase_units[0].payments.captures[0];
      
      // Create transaction record
      const transaction: PaymentTransaction = {
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code.toLowerCase(),
        provider: 'paypal',
        status: capture.status === 'COMPLETED' ? 'completed' : 'pending',
        externalId: capture.id,
        metadata: {
          paypalOrderId: orderId,
          captureId: capture.id
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return transaction;
    } catch (error) {
      console.error(`Error capturing PayPal payment for order ${orderId}:`, error);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Create a refund for a payment
   */
  public async createRefund(paymentId: string, amount?: number): Promise<boolean> {
    try {
      return await this.createPayPalRefund(paymentId, amount);
    } catch (error) {
      console.error(`Error creating refund for payment ${paymentId}:`, error);
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a PayPal refund
   */
  private async createPayPalRefund(captureId: string, amount?: number): Promise<boolean> {
    try {
      await this.getPayPalAccessToken();

      // Prepare the refund data
      const refundData: any = {};
      
      if (amount) {
        // If a specific amount is provided, include it in the request
        // We need to get the currency from the original payment first
        const captureDetails = await axios({
          method: 'GET',
          url: `${this.paypalBaseUrl}/v2/payments/captures/${captureId}`,
          headers: {
            'Authorization': `Bearer ${this.paypalAccessToken}`
          }
        });
        
        const currency = captureDetails.data.amount.currency_code;
        
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: currency
        };
      }

      // Create the refund
      await axios({
        method: 'POST',
        url: `${this.paypalBaseUrl}/v2/payments/captures/${captureId}/refund`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.paypalAccessToken}`
        },
        data: Object.keys(refundData).length ? refundData : undefined
      });

      return true;
    } catch (error) {
      console.error(`Error creating PayPal refund for capture ${captureId}:`, error);
      throw new Error('Failed to create PayPal refund');
    }
  }
}

// Export a singleton instance
export const paymentProcessor = new PaymentProcessor();
