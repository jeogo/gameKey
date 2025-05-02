import { IPaymentTransaction } from '../models/PaymentTransaction';
import * as PaymentRepository from '../repositories/PaymentRepository';
import * as OrderRepository from '../repositories/OrderRepository';
import * as ProductRepository from '../repositories/ProductRepository';
import { ObjectId } from 'mongodb';
import { paymentProcessor } from '../services/PaymentProcessor';
import { Request, Response } from "express";
import { handlePaymentSuccess } from "../bot/handlers/paymentHandlers";

/**
 * Get all payment transactions with optional filtering
 */
export async function getAllTransactions(
  filter: any = {},
  page = 1,
  limit = 20
): Promise<{ transactions: IPaymentTransaction[], total: number }> {
  try {
    const skip = (page - 1) * limit;
    const transactions = await PaymentRepository.findAllTransactions(filter, skip, limit);
    const total = await PaymentRepository.countTransactions(filter);
    
    return { transactions, total };
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id: string): Promise<IPaymentTransaction | null> {
  try {
    return await PaymentRepository.findTransactionById(id);
  } catch (error) {
    console.error(`Error getting transaction with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get transactions for a specific user
 */
export async function getUserTransactions(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ transactions: IPaymentTransaction[], total: number }> {
  try {
    const filter = { userId };
    const skip = (page - 1) * limit;
    const transactions = await PaymentRepository.findAllTransactions(filter, skip, limit);
    const total = await PaymentRepository.countTransactions(filter);
    
    return { transactions, total };
  } catch (error) {
    console.error(`Error getting transactions for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get transactions for a specific order
 */
export async function getOrderTransactions(orderId: string): Promise<IPaymentTransaction[]> {
  try {
    return await PaymentRepository.findTransactionsByOrderId(orderId);
  } catch (error) {
    console.error(`Error getting transactions for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Update transaction status with notification to user
 */
export async function updateTransactionStatus(
  id: string,
  status: IPaymentTransaction['status'],
  additionalData: Partial<IPaymentTransaction> = {}
): Promise<IPaymentTransaction | null> {
  try {
    const originalTransaction = await PaymentRepository.findTransactionById(id);
    if (!originalTransaction) {
      return null;
    }
    
    // Only proceed with update if status is actually changing
    if (originalTransaction.status === status) {
      return originalTransaction;
    }
    
    const transaction = await PaymentRepository.updateTransactionStatus(id, status, additionalData);
    
    // If transaction was updated successfully
    if (transaction) {
      // Get order information
      const order = await OrderRepository.findOrderById(transaction.orderId);
      
      // Update order status based on payment status
      if (status === 'completed' && transaction.orderId) {
        await OrderRepository.updateOrderStatus(
          transaction.orderId,
          'completed',
          `Payment marked as completed`
        );
        
        // Notify user about successful payment
        if (order) {
          const product = await ProductRepository.findProductById(order.productId);
          await notifyUserAboutPayment(
            transaction.userId,
            'completed',
            {
              productName: product?.name || 'your order',
              orderId: order._id!,
              amount: transaction.amount,
              paymentMethod: transaction.paymentProvider
            }
          );
        }
      } else if (status === 'failed' && transaction.orderId) {
        await OrderRepository.updateOrderStatus(
          transaction.orderId,
          'cancelled',
          `Payment marked as failed`
        );
        
        // Notify user about failed payment
        if (order) {
          await notifyUserAboutPayment(
            transaction.userId, 
            'failed',
            {
              orderId: order._id!,
              amount: transaction.amount,
              paymentMethod: transaction.paymentProvider
            }
          );
        }
      }
    }
    
    return transaction;
  } catch (error) {
    console.error(`Error updating transaction status ${id}:`, error);
    throw error;
  }
}

/**
 * Notify user about payment status changes
 */
async function notifyUserAboutPayment(
  userId: string,
  status: 'completed' | 'failed' | 'pending',
  paymentInfo: {
    productName?: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
  }
): Promise<void> {
  try {
    // Import bot here to avoid circular dependency
    const { bot } = require('../bot');
    
    // Create appropriate message based on status
    let message = '';
    if (status === 'completed') {
      message = `✅ *Payment Successful!*\n\n`
        + `Your payment of $${paymentInfo.amount} for ${paymentInfo.productName} has been received.\n\n`
        + `Order #${paymentInfo.orderId.slice(-6)} is now being processed.`;
    } else if (status === 'failed') {
      message = `❌ *Payment Failed*\n\n`
        + `We couldn't process your payment of $${paymentInfo.amount}.\n\n`
        + `Order #${paymentInfo.orderId.slice(-6)} has been cancelled. `
        + `Please try again or contact support.`;
    } else {
      message = `⏳ *Payment Pending*\n\n`
        + `Your payment of $${paymentInfo.amount} is being processed.\n\n`
        + `We'll notify you once it's confirmed.`;
    }
    
    // Send notification to user
    await bot.api.sendMessage(parseInt(userId), message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error(`Failed to send payment notification to user ${userId}:`, error);
  }
}

/**
 * Check payment status (useful for API endpoints)
 */
export async function checkPaymentStatus(id: string): Promise<IPaymentTransaction | null> {
  try {
    // Get the transaction
    const transaction = await PaymentRepository.findTransactionById(id);
    if (!transaction) {
      return null;
    }
    // تحقق فقط من حالة معاملات NowPayments (crypto)
    if (transaction.paymentProvider === 'crypto' &&
        transaction.status === 'pending' &&
        transaction.providerTransactionId) {
      // تحقق من حالة الدفع عبر NowPayments
      const paymentStatus = await paymentProcessor.checkPaymentStatus(transaction.providerTransactionId);
      if (paymentStatus === 'completed') {
        // Update transaction as completed
        return await PaymentRepository.updateTransactionStatus(id, 'completed');
      }
    }
    return transaction;
  } catch (error) {
    console.error(`Error checking payment status for transaction ${id}:`, error);
    throw error;
  }
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  paymentsByMethod: { [key: string]: { count: number, amount: number } };
}> {
  try {
    return await PaymentRepository.getPaymentStatistics(startDate, endDate);
  } catch (error) {
    console.error('Error getting payment statistics:', error);
    throw error;
  }
}

export async function paypalSuccess(req: Request, res: Response) {
  try {
    const transactionId = req.query.txId as string; // example param for your success URL
    // Possibly capture or verify payment here
    await handlePaymentSuccess(transactionId);
    res.status(200).json({ message: "Payment success processed." });
  } catch (error) {
    res.status(500).json({ error: "Failed to confirm payment." });
  }
}
