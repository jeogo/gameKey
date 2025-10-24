import axios from 'axios';
import * as dotenv from 'dotenv';
import { getBestAvailableCurrency, getCurrencyDisplayInfo } from '../utils/cryptoUtils';

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
  orderId: string;
  productName: string;
  userId: string;
  cryptoCurrency: 'BTC' | 'ETH' | 'USDT' | 'LTC';
}

export class NowPaymentsService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.nowpayments.io/v1';
  private readonly sandboxUrl: string = 'https://api-sandbox.nowpayments.io/v1';

  constructor() {
    // Force reload environment variables
    require('dotenv').config();
    this.apiKey = process.env.NOWPAYMENTS_API_KEY || '';
    console.log(
      '🔑 API Key loaded:',
      this.apiKey ? 'Yes (' + this.apiKey.substring(0, 8) + '...)' : 'No'
    );
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('📦 Sandbox mode:', process.env.NOWPAYMENTS_SANDBOX || 'false');
    if (!this.apiKey) {
      console.error('❌ NOWPAYMENTS_API_KEY not set in environment variables');
    }
  }

  /**
   * Create a payment and return payment URL for user to pay
   */
  async createPayment(options: CreatePaymentOptions): Promise<PaymentTransaction> {
    try {
      console.log(`🔄 Creating ${options.cryptoCurrency} payment for $${options.amount}`);

      // Use production API directly (sandbox may have issues)
      const apiUrl = process.env.NOWPAYMENTS_SANDBOX === 'true' ? this.sandboxUrl : this.baseUrl;
      console.log('🌐 Using API URL:', apiUrl);

      // Get available currencies first
      const availableCurrencies = await this.getAvailableCurrencies();
      console.log(`🎯 User requested: ${options.cryptoCurrency.toUpperCase()}`);
      console.log(`📋 Available currencies:`, availableCurrencies.slice(0, 15));

      // Use enhanced currency selection
      const bestCurrency = getBestAvailableCurrency(options.cryptoCurrency, availableCurrencies);

      if (!bestCurrency) {
        throw new Error(`No suitable currency available for ${options.cryptoCurrency}`);
      }

      const selectedCurrency = bestCurrency.symbol;
      const currencyDisplay = getCurrencyDisplayInfo(selectedCurrency);

      console.log(`✅ Selected currency: ${currencyDisplay}`);
      console.log(`⚡ Avg confirmation time: ${bestCurrency.averageConfirmationTime} min`);

      if (selectedCurrency !== options.cryptoCurrency.toLowerCase()) {
        console.log(
          `🔄 Auto-switched from ${options.cryptoCurrency.toUpperCase()} to ${selectedCurrency.toUpperCase()}`
        );
      }

      // Create invoice for crypto payment
      const invoiceData = {
        price_amount: options.amount,
        price_currency: 'usd', // Always USD as base
        pay_currency: selectedCurrency,
        order_id: options.orderId,
        order_description: `GameKey: ${options.productName}`,
        ipn_callback_url: `${process.env.WEBHOOK_URL || 'https://webhook.site/unique-id'}/webhook/nowpayments`,
        success_url: `https://t.me/${process.env.BOT_USERNAME || 'GameKeyBot'}?start=success_${options.orderId}`,
        cancel_url: `https://t.me/${process.env.BOT_USERNAME || 'GameKeyBot'}?start=cancel_${options.orderId}`,
        is_fee_paid_by_user: false,
      };

      console.log('📝 Invoice data:', invoiceData);

      const response = await axios.post(`${apiUrl}/invoice`, invoiceData, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const invoice = response.data;
      console.log('✅ Invoice created:', invoice);

      if (!invoice.invoice_url) {
        throw new Error('No invoice URL returned from NOWPayments');
      }

      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: invoice.id || `invoice-${Date.now()}`,
        paymentUrl: invoice.invoice_url,
        metadata: {
          orderId: options.orderId,
          userId: options.userId,
          productName: options.productName,
          cryptoCurrency: options.cryptoCurrency,
          invoiceId: invoice.id,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('❌ Error creating NOWPayments invoice:', error);
      console.error('📊 Response data:', error.response?.data);

      // If currency is unavailable, try with USDT first, then BTC as fallback
      if (
        error.response?.data?.code === 'INVALID_REQUEST_PARAMS' &&
        error.response?.data?.message?.includes('unavailable')
      ) {
        // If user didn't choose USDT, try USDT ERC20 first
        if (!options.cryptoCurrency.toLowerCase().includes('usdt')) {
          console.log('🔄 Currency unavailable, trying with USDT ERC20...');
          const usdtOptions = { ...options, cryptoCurrency: 'USDT' as any }; // This will be converted to usdterc20
          try {
            return await this.createPayment(usdtOptions);
          } catch {
            console.log('🔄 USDT also unavailable, trying with BTC...');
          }
        }

        console.log('🔄 Trying with BTC as final fallback...');
        const btcOptions = { ...options, cryptoCurrency: 'BTC' as any };
        try {
          return await this.createPayment(btcOptions);
        } catch {
          console.error('❌ BTC payment also failed, using alternative link');
        }
      }

      // Create alternative payment using direct NOWPayments link
      console.log('🔄 Creating alternative payment link...');
      const alternativeUrl = this.createAlternativePayment(options);

      return {
        amount: options.amount,
        currency: options.currency,
        provider: 'nowpayments',
        status: 'pending',
        externalId: `alt_${options.orderId}`,
        paymentUrl: alternativeUrl,
        metadata: {
          orderId: options.orderId,
          userId: options.userId,
          productName: options.productName,
          cryptoCurrency: options.cryptoCurrency,
          isAlternative: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get available currencies from NOWPayments
   */
  async getAvailableCurrencies(): Promise<string[]> {
    try {
      const apiUrl = process.env.NOWPAYMENTS_SANDBOX === 'true' ? this.sandboxUrl : this.baseUrl;
      const response = await axios.get(`${apiUrl}/currencies`, {
        headers: {
          'x-api-key': this.apiKey,
        },
        timeout: 10000,
      });

      console.log(
        '💰 Available currencies:',
        response.data.currencies?.slice(0, 10) || 'Failed to fetch'
      );
      return response.data.currencies || ['usdterc20', 'usdttrc20', 'btc', 'eth', 'ltc']; // Fallback with real USDT variants
    } catch {
      console.warn('⚠️ Failed to fetch available currencies, using defaults');
      return ['usdterc20', 'usdttrc20', 'btc', 'eth', 'ltc']; // Safe fallback with real USDT variants
    }
  }

  /**
   * Create alternative payment URL using direct method
   */
  private createAlternativePayment(options: CreatePaymentOptions): string {
    console.log('🔗 Creating direct payment link for', options.cryptoCurrency);

    // Determine best currency to use (prefer user's choice, prioritize USDT)
    const userChoice = options.cryptoCurrency.toLowerCase();
    let selectedCurrency = userChoice;

    // Always prefer USDT if user selected it, or if their choice isn't reliable
    if (userChoice === 'usdt') {
      selectedCurrency = 'usdterc20'; // Use proper USDT ERC20 variant
    } else {
      const reliableCurrencies = ['usdterc20', 'usdttrc20', 'btc', 'eth', 'ltc'];
      selectedCurrency = reliableCurrencies.includes(userChoice) ? userChoice : 'usdterc20'; // Default to USDT ERC20 instead of BTC
    }

    // Create a comprehensive payment URL with user's preferred currency
    const baseParams = new URLSearchParams({
      amount: options.amount.toString(),
      currency_from: 'usd',
      currency_to: selectedCurrency,
      order_id: options.orderId,
      order_description: `GameKey: ${options.productName}`,
      success_url: `https://t.me/${process.env.BOT_USERNAME || 'GameKeyBot'}?start=success_${options.orderId}`,
      cancel_url: `https://t.me/${process.env.BOT_USERNAME || 'GameKeyBot'}?start=cancel_${options.orderId}`,
      // Add more parameters for better user experience
      customer_email: '',
      is_fixed_rate: 'false',
      is_fee_paid_by_user: 'false',
    });

    // Use NOWPayments public widget with user's chosen currency
    const directUrl = `https://nowpayments.io/payment/?${baseParams.toString()}`;
    console.log(
      '🌐 Direct payment URL created with',
      selectedCurrency.toUpperCase(),
      ':',
      directUrl
    );

    return directUrl;
  }

  /**
   * Check payment status by external ID
   */
  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    try {
      const isSandbox = process.env.NODE_ENV !== 'production';
      const apiUrl = isSandbox ? this.sandboxUrl : this.baseUrl;

      const response = await axios.get(`${apiUrl}/payment/${externalId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      const payment = response.data;
      console.log('📊 Payment status check:', payment);

      switch (payment.payment_status) {
        case 'finished':
        case 'confirmed':
          return 'completed';
        case 'failed':
          return 'failed';
        case 'waiting':
        case 'confirming':
        case 'sending':
          return 'pending';
        case 'refunded':
          return 'refunded';
        case 'expired':
        case 'cancelled':
          return 'cancelled';
        default:
          return 'pending';
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error);

      // In development mode, simulate payment completion after a delay
      if (process.env.NODE_ENV === 'development' && externalId.startsWith('mock-')) {
        const mockCreatedTime = parseInt(externalId.replace('mock-', ''));
        const now = Date.now();
        const elapsed = now - mockCreatedTime;

        // Simulate payment completion after 1 minute in development
        if (elapsed > 60000) {
          console.log('🧪 Mock payment completed (development mode)');
          return 'completed';
        }
      }

      return 'pending';
    }
  }

  /**
   * Process webhook from NOWPayments
   */
  processWebhook(webhookData: any): { status: PaymentStatus; externalId: string } | null {
    try {
      console.log('🔔 Processing NOWPayments webhook:', webhookData);

      if (!webhookData || !webhookData.payment_id) {
        console.error('❌ Invalid webhook data: missing payment_id');
        return null;
      }

      let status: PaymentStatus;
      switch (webhookData.payment_status) {
        case 'finished':
        case 'confirmed':
          status = 'completed';
          break;
        case 'failed':
          status = 'failed';
          break;
        case 'waiting':
        case 'confirming':
        case 'sending':
          status = 'pending';
          break;
        case 'refunded':
          status = 'refunded';
          break;
        case 'expired':
        case 'cancelled':
          status = 'cancelled';
          break;
        default:
          status = 'pending';
      }

      return {
        status,
        externalId: webhookData.payment_id,
      };
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return null;
    }
  }
}

// Export singleton instance
export const nowPaymentsService = new NowPaymentsService();
