import { Bot } from 'grammy';
import { MyContext } from '../types/session';
import * as PaymentRepository from '../../repositories/PaymentRepository';
import * as ProductRepository from '../../repositories/ProductRepository';
import * as OrderRepository from '../../repositories/OrderRepository';
import * as UserRepository from '../../repositories/UserRepository';
import { IPaymentTransaction } from '../../models/PaymentTransaction';
import { nowPaymentsService } from '../../services/NowPaymentsService';

/**
 * Enhanced payment webhook processing with proper provider handling
 */
export async function processPaymentWebhook(provider: string, webhookData: any): Promise<boolean> {
  try {
    console.log(`🔔 Processing ${provider} webhook:`, JSON.stringify(webhookData, null, 2));

    switch (provider.toLowerCase()) {
      case 'nowpayments':
        return await processNowPaymentsWebhook(webhookData);
      case 'paypal':
        return await processPayPalWebhook(webhookData);
      case 'stripe':
        return await processStripeWebhook(webhookData);
      default:
        console.warn(`⚠️ Unsupported payment provider: ${provider}`);
        return false;
    }
  } catch (error) {
    console.error('❌ Error processing payment webhook:', error);
    return false;
  }
}

/**
 * Process NOWPayments webhook with complete logic
 */
async function processNowPaymentsWebhook(webhookData: any): Promise<boolean> {
  try {
    const { payment_id, payment_status, order_id } = webhookData;

    if (!payment_id || !payment_status) {
      console.error('❌ Invalid NOWPayments webhook - missing required fields');
      return false;
    }

    // Find transaction by provider payment ID or order ID
    let transaction = await PaymentRepository.findTransactionByProviderId(payment_id);

    if (!transaction && order_id) {
      // Try to find by order ID if payment ID lookup fails
      const orders = await OrderRepository.findOrders({ _id: order_id }, 1, 1);
      if (orders.orders.length > 0) {
        const orderTransactions = await PaymentRepository.findTransactionsByOrderId(order_id);
        transaction = orderTransactions[0] || null;
      }
    }

    if (!transaction) {
      console.error(
        `❌ Transaction not found for payment_id: ${payment_id}, order_id: ${order_id}`
      );
      return false;
    }

    console.log(`🔄 Processing payment ${payment_id} status: ${payment_status}`);

    // Map NOWPayments statuses to internal statuses
    const statusMapping: Record<string, IPaymentTransaction['status']> = {
      waiting: 'pending',
      confirming: 'pending',
      confirmed: 'completed',
      sending: 'completed',
      finished: 'completed',
      failed: 'failed',
      // 'refunded': removed from simplified model
      expired: 'failed',
    };

    const newStatus = statusMapping[payment_status.toLowerCase()] || 'pending';

    // Update transaction with simplified data
    const updatedTransaction = await PaymentRepository.updateTransactionStatus(
      transaction._id!,
      newStatus,
      {
        providerTransactionId: payment_id,
        // Simplified PaymentTransaction model - webhookData, metadata, completedAt removed
      }
    );

    if (!updatedTransaction) {
      console.error(`❌ Failed to update transaction: ${transaction._id}`);
      return false;
    }

    // Process based on status
    if (newStatus === 'completed') {
      await handleSuccessfulPayment(transaction);
    } else if (newStatus === 'failed') {
      await handleFailedPayment(transaction, `Payment ${payment_status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error processing NOWPayments webhook:', error);
    return false;
  }
}

/**
 * Handle successful payment completion
 */
async function handleSuccessfulPayment(transaction: IPaymentTransaction): Promise<void> {
  try {
    console.log(`🎉 Processing successful payment: ${transaction._id}`);

    // Update order to delivered
    const order = await OrderRepository.updateOrderStatus(transaction.orderId, 'delivered');

    if (!order) {
      console.error(`❌ Order not found: ${transaction.orderId}`);
      return;
    }

    // Get product and user details
    const [product, user] = await Promise.all([
      ProductRepository.findProductById(order.productId),
      UserRepository.findUserById(order.userId),
    ]);

    if (!product) {
      console.error(`❌ Product not found: ${order.productId}`);
      await notifyPaymentIssue(transaction.userId, order, 'Product not found');
      return;
    }

    if (!user) {
      console.error(`❌ User not found: ${order.userId}`);
      return;
    }

    // Handle digital content delivery
    if (product.digitalContent && product.digitalContent.length >= order.quantity) {
      const contentToDeliver = product.digitalContent.slice(0, order.quantity);
      const remainingContent = product.digitalContent.slice(order.quantity);

      // Update product inventory
      await ProductRepository.updateProduct(order.productId, {
        digitalContent: remainingContent,
        isAvailable: remainingContent.length > 0,
        // Simplified Product model - updatedAt removed
      });

      // Deliver content to user
      await deliverDigitalContent(user.telegramId, order, product, contentToDeliver);

      console.log(`✅ Digital content delivered for order: ${order._id}`);
    } else {
      // Handle insufficient inventory
      console.warn(`⚠️ Insufficient inventory for order: ${order._id}`);
      await notifyInventoryIssue(user.telegramId, order, product);
    }
  } catch (error) {
    console.error('❌ Error handling successful payment:', error);
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(
  transaction: IPaymentTransaction,
  reason: string
): Promise<void> {
  try {
    console.log(`❌ Processing failed payment: ${transaction._id}, reason: ${reason}`);

    // Update order to cancelled if exists
    if (transaction.orderId) {
      await OrderRepository.updateOrderStatus(transaction.orderId, 'cancelled');
    }

    // Get user details
    const user = await UserRepository.findUserById(transaction.userId);
    if (user) {
      await notifyPaymentFailure(user.telegramId, transaction, reason);
    }
  } catch (error) {
    console.error('❌ Error handling failed payment:', error);
  }
}

/**
 * Deliver digital content to user via Telegram
 */
async function deliverDigitalContent(
  telegramId: number,
  order: any,
  product: any,
  content: string[]
): Promise<void> {
  try {
    const bot = (await import('../../bot')).bot;

    let message = `🎮 **ORDER COMPLETED - DIGITAL DELIVERY**\n\n`;
    message += `📋 **Order ID:** #${order._id.toString().slice(-8)}\n`;
    message += `🎯 **Product:** ${product.name}\n`;
    message += `📊 **Quantity:** ${order.quantity}\n`;
    message += `💰 **Total:** $${order.totalAmount}\n\n`;
    message += `🔐 **YOUR DIGITAL CONTENT:**\n\n`;

    content.forEach((item, index) => {
      const [email, password] = item.includes(':') ? item.split(':', 2) : [item, ''];
      message += `**Item ${index + 1}:**\n`;

      if (password) {
        message += `📧 Email: \`${email}\`\n`;
        message += `🔑 Password: \`${password}\`\n\n`;
      } else {
        message += `🎫 Code: \`${email}\`\n\n`;
      }
    });

    message += `✅ Your order has been completed successfully!\n`;
    message += `📞 Need help? Contact our support team.\n\n`;
    message += `Thank you for your purchase! 🙏`;

    await bot.api.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('❌ Error delivering digital content:', error);
  }
}

/**
 * Notify user about payment failure
 */
async function notifyPaymentFailure(
  telegramId: number,
  transaction: IPaymentTransaction,
  reason: string
): Promise<void> {
  try {
    const bot = (await import('../../bot')).bot;

    const message =
      `❌ **PAYMENT FAILED**\n\n` +
      `We couldn't process your payment of $${transaction.amount} ${transaction.currency}.\n\n` +
      `**Reason:** ${reason}\n\n` +
      `Please try again or contact support for assistance.\n\n` +
      `**Transaction ID:** ${transaction._id}`;

    await bot.api.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('❌ Error notifying payment failure:', error);
  }
}

/**
 * Notify about payment issues
 */
async function notifyPaymentIssue(userId: string, order: any, issue: string): Promise<void> {
  try {
    const user = await UserRepository.findUserById(userId);
    if (!user) return;

    const bot = (await import('../../bot')).bot;

    const message =
      `⚠️ **ORDER STATUS UPDATE**\n\n` +
      `Your payment has been confirmed, but we encountered an issue:\n\n` +
      `**Issue:** ${issue}\n` +
      `**Order ID:** #${order._id.toString().slice(-8)}\n\n` +
      `Our team has been notified and will resolve this promptly.\n` +
      `We'll contact you with updates soon.`;

    await bot.api.sendMessage(user.telegramId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('❌ Error notifying payment issue:', error);
  }
}

/**
 * Notify about inventory issues
 */
async function notifyInventoryIssue(telegramId: number, order: any, product: any): Promise<void> {
  try {
    const bot = (await import('../../bot')).bot;

    const message =
      `📦 **INVENTORY UPDATE**\n\n` +
      `Your payment for **${product.name}** has been confirmed!\n\n` +
      `However, we need to restock this item. Your order is secure and we'll deliver it within 24-48 hours.\n\n` +
      `**Order ID:** #${order._id.toString().slice(-8)}\n\n` +
      `We'll notify you as soon as your order is ready for delivery.\n\n` +
      `Thank you for your patience! 🙏`;

    await bot.api.sendMessage(telegramId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error('❌ Error notifying inventory issue:', error);
  }
}

/**
 * Check payment status with provider
 */
export async function checkPaymentStatusWithProvider(transactionId: string): Promise<boolean> {
  try {
    const transaction = await PaymentRepository.findTransactionById(transactionId);

    if (!transaction) {
      console.error(`❌ Transaction not found: ${transactionId}`);
      return false;
    }

    // Skip if already completed or failed
    if (['completed', 'failed', 'cancelled'].includes(transaction.status)) {
      return true;
    }

    console.log(`🔍 Checking payment status for transaction: ${transactionId}`);

    switch (transaction.paymentProvider.toLowerCase()) {
      case 'nowpayments':
        return await checkNowPaymentsStatus(transaction);
      default:
        console.warn(
          `⚠️ Status check not implemented for provider: ${transaction.paymentProvider}`
        );
        return false;
    }
  } catch (error) {
    console.error(`❌ Error checking payment status for ${transactionId}:`, error);
    return false;
  }
}

/**
 * Check NOWPayments specific status
 */
async function checkNowPaymentsStatus(transaction: IPaymentTransaction): Promise<boolean> {
  try {
    if (!transaction.providerTransactionId) {
      console.warn('⚠️ No provider transaction ID for NOWPayments check');
      return false;
    }

    const providerStatus = await nowPaymentsService.getPaymentStatus(
      transaction.providerTransactionId
    );

    if (providerStatus && providerStatus !== transaction.status) {
      console.log(`🔄 Status update from NOWPayments: ${transaction.status} → ${providerStatus}`);

      // Map refunded to cancelled for simplified model
      const mappedStatus = providerStatus === 'refunded' ? 'cancelled' : providerStatus;

      await PaymentRepository.updateTransactionStatus(transaction._id!, mappedStatus as any, {
        // Simplified PaymentTransaction model - metadata removed
      });

      if (providerStatus === 'completed') {
        await handleSuccessfulPayment(transaction);
      } else if (providerStatus === 'failed') {
        await handleFailedPayment(transaction, 'Payment verification failed');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking NOWPayments status:', error);
    return false;
  }
}

/**
 * Placeholder for PayPal webhook processing
 */
async function processPayPalWebhook(_webhookData: any): Promise<boolean> {
  console.log('📝 PayPal webhook processing not implemented yet');
  return false;
}

/**
 * Placeholder for Stripe webhook processing
 */
async function processStripeWebhook(_webhookData: any): Promise<boolean> {
  console.log('📝 Stripe webhook processing not implemented yet');
  return false;
}

/**
 * Enhanced callback handler for payment verification
 */
export function registerEnhancedPaymentHandlers(bot: Bot<MyContext>): void {
  // Enhanced payment check callback
  bot.callbackQuery(/^check_payment_(.+)$/, async ctx => {
    const paymentId = ctx.match![1];

    try {
      await ctx.answerCallbackQuery('🔍 Checking payment status...');

      // Check payment status with provider
      const statusChecked = await checkPaymentStatusWithProvider(paymentId);

      if (!statusChecked) {
        await ctx.editMessageText(
          '❌ **Payment Check Failed**\n\n' +
            "We couldn't verify your payment status right now.\n\n" +
            'Please try again in a few minutes or contact support.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Get updated transaction
      const transaction = await PaymentRepository.findTransactionById(paymentId);

      if (!transaction) {
        await ctx.editMessageText(
          '❌ **Transaction Not Found**\n\n' + 'Please contact support with your transaction ID.',
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Update user based on current status
      switch (transaction.status) {
        case 'completed':
          await ctx.editMessageText(
            '✅ **Payment Confirmed!**\n\n' +
              'Your payment has been verified and your order is being processed.\n\n' +
              'You will receive your digital content shortly.',
            { parse_mode: 'Markdown' }
          );
          break;

        case 'pending':
          await ctx.editMessageText(
            '⏳ **Payment Processing**\n\n' +
              'Your payment is still being confirmed by the network.\n\n' +
              'Please check back in a few minutes.',
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Check Again', callback_data: `check_payment_${paymentId}` }],
                ],
              },
            }
          );
          break;

        case 'failed':
        case 'cancelled':
          await ctx.editMessageText(
            '❌ **Payment Failed**\n\n' +
              'Your payment could not be processed.\n\n' +
              'Please try again or contact support for assistance.',
            { parse_mode: 'Markdown' }
          );
          break;

        default:
          await ctx.editMessageText(
            '⏳ **Status Unknown**\n\n' +
              "We're still checking your payment status.\n\n" +
              'Please try again in a few minutes.',
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Check Again', callback_data: `check_payment_${paymentId}` }],
                ],
              },
            }
          );
      }
    } catch (error) {
      console.error('❌ Error in payment check callback:', error);
      await ctx.editMessageText(
        '❌ **Error**\n\n' +
          'Something went wrong while checking your payment.\n\n' +
          'Please contact support for assistance.',
        { parse_mode: 'Markdown' }
      );
    }
  });
}
