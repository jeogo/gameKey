import { IOrder } from '../models/Order';
import * as OrderRepository from '../repositories/OrderRepository';
import * as ProductRepository from '../repositories/ProductRepository';

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<IOrder | null> {
  try {
    return await OrderRepository.findOrderById(id);
  } catch (error) {
    console.error(`Error getting order with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get orders with pagination and filtering
 */
export async function getOrders(
  filter: any = {},
  page = 1,
  limit = 20
): Promise<{ orders: IOrder[]; total: number }> {
  try {
    return await OrderRepository.findOrders(filter, page, limit);
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
}

/**
 * Get orders for a specific user
 */
export async function getUserOrders(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ orders: IOrder[]; total: number }> {
  try {
    return await OrderRepository.findOrdersByUserId(userId, page, limit);
  } catch (error) {
    console.error(`Error getting orders for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create a new order - Simplified
 */
export async function createOrder(data: {
  userId: string;
  productId: string;
  quantity: number;
}): Promise<IOrder> {
  try {
    // Get product for price information
    const product = await ProductRepository.findProductById(data.productId);
    if (!product) {
      throw new Error(`Product not found with ID: ${data.productId}`);
    }

    // Create the order with current product price
    return await OrderRepository.createOrder({
      ...data,
      unitPrice: product.price,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status - Simplified
 */
export async function updateOrderStatus(
  id: string,
  status: IOrder['status']
): Promise<IOrder | null> {
  try {
    return await OrderRepository.updateOrderStatus(id, status);
  } catch (error) {
    console.error(`Error updating status for order ${id}:`, error);
    throw error;
  }
}

/**
 * Get sales statistics
 */
export async function getSalesStatistics(
  startDate?: string,
  endDate?: string
): Promise<{
  totalSales: number;
  totalOrders: number;
  productSales: { productId: string; quantity: number; totalAmount: number }[];
}> {
  try {
    // Parse date strings if provided
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    return await OrderRepository.getSalesStatistics(parsedStartDate, parsedEndDate);
  } catch (error) {
    console.error('Error getting sales statistics:', error);
    throw error;
  }
}

/**
 * Get orders by status
 */
export async function findOrdersByStatus(
  status: IOrder['status']
): Promise<{ orders: IOrder[]; total: number }> {
  try {
    return await OrderRepository.findOrders({ status }, 1, 100);
  } catch (error) {
    console.error(`Error finding orders with status ${status}:`, error);
    // Return an empty result structure instead of throwing to prevent 'void' error
    return { orders: [], total: 0 };
  }
}

/**
 * Get order status display info with explanation
 */
export function getOrderStatusInfo(order: {
  status: string;
  customerNote?: string;
  type?: string;
}): {
  statusText: string;
  statusEmoji: string;
  statusColor: string;
  explanation: string;
} {
  let statusEmoji = '⌛';
  let statusText = order.status;
  let statusColor = '#f5a623'; // Default amber color for pending
  let explanation = '';

  switch (order.status) {
    case 'completed':
      statusEmoji = '✅';
      statusText = 'Completed';
      statusColor = '#4CAF50'; // Green
      explanation = 'Your order has been completed and delivered';
      break;
    case 'cancelled':
      statusEmoji = '❌';
      statusText = 'Cancelled';
      statusColor = '#F44336'; // Red
      explanation = 'This order has been cancelled';
      break;
    case 'pending':
      // Check if it's a pre-order
      if (
        order.type === 'preorder' ||
        (order.customerNote && order.customerNote.toLowerCase().includes('preorder'))
      ) {
        statusEmoji = '⏳';
        statusText = 'Pre-ordered';
        statusColor = '#2196F3'; // Blue
        explanation = "Pre-order received. You'll be notified when the product is available";
      } else {
        statusEmoji = '⌛';
        statusText = 'Pending';
        explanation = 'Your order is being processed';
      }
      break;
    case 'failed':
      statusEmoji = '❌';
      statusText = 'Failed';
      statusColor = '#F44336'; // Red
      explanation = 'Order processing failed. Please contact support';
      break;
    default:
      explanation = 'Status unknown. Please contact support';
  }

  return { statusText, statusEmoji, statusColor, explanation };
}

/**
 * Fulfill order - Deliver product content to customer (Simplified)
 */
export async function fulfillOrder(
  orderId: string,
  deliveredContent: string[]
): Promise<IOrder | null> {
  try {
    // Update order status to delivered and add content
    return await OrderRepository.fulfillOrder(orderId, deliveredContent);
  } catch (error) {
    console.error(`Error fulfilling order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Delete order
 */
export async function deleteOrder(id: string): Promise<boolean> {
  try {
    return await OrderRepository.deleteOrder(id);
  } catch (error) {
    console.error(`Error deleting order ${id}:`, error);
    throw error;
  }
}

export async function syncOrderStatusWithPayments(): Promise<{ updated: number; errors: number }> {
  // Replace the following with actual logic
  const updated = 0; // Example: Number of orders updated
  const errors = 0; // Example: Number of errors encountered
  return { updated, errors };
}
