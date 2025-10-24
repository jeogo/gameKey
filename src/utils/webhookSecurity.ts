import { Request } from 'express';
import crypto from 'crypto';

/**
 * Security utilities for webhook signature verification
 */

/**
 * Validate NOWPayments webhook signature
 * @param req Express request object
 * @returns boolean indicating if signature is valid
 */
export function validateNowPaymentsSignature(req: Request): boolean {
  try {
    const signature = req.headers['x-nowpayments-sig'] as string;
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    if (!signature || !ipnSecret) {
      console.warn('⚠️ Missing signature or IPN secret for webhook validation');
      return false;
    }

    // NOWPayments uses HMAC SHA512
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha512', ipnSecret).update(payload).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      console.error('❌ Invalid NOWPayments webhook signature');
      console.error('Expected:', expectedSignature);
      console.error('Received:', signature);
    }

    return isValid;
  } catch (error) {
    console.error('❌ Error validating NOWPayments signature:', error);
    return false;
  }
}

/**
 * Generate secure webhook URLs with validation tokens
 */
export function generateSecureWebhookUrl(baseUrl: string, provider: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  return `${baseUrl}/api/payments/webhook/${provider}?token=${token}`;
}

/**
 * Validate webhook origin and rate limiting
 */
export function validateWebhookOrigin(req: Request, allowedIPs?: string[]): boolean {
  const clientIP = req.ip || req.connection.remoteAddress;

  // NOWPayments IP ranges (add more as needed)
  const nowPaymentsIPs = ['52.81.118.47', '18.221.100.18', '18.224.12.72'];

  if (allowedIPs) {
    return allowedIPs.includes(clientIP || '');
  }

  // For NOWPayments, check against their known IPs
  return nowPaymentsIPs.includes(clientIP || '');
}

/**
 * Webhook rate limiting tracker
 */
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkWebhookRateLimit(
  identifier: string,
  maxRequests = 100,
  windowMs = 60000
): boolean {
  const now = Date.now();
  const data = webhookRateLimit.get(identifier);

  if (!data || now > data.resetTime) {
    webhookRateLimit.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count >= maxRequests) {
    return false;
  }

  data.count++;
  return true;
}
