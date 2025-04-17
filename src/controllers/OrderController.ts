import { IOrder } from '../models/Order';
import * as OrderRepository from '../repositories/OrderRepository';
import * as ProductRepository from '../repositories/ProductRepository';
import { bot } from '../bot';

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
): Promise<{ orders: IOrder[], total: number }> {
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
): Promise<{ orders: IOrder[], total: number }> {
  try {
    return await OrderRepository.findOrdersByUserId(userId, page, limit);
  } catch (error) {
    console.error(`Error getting orders for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create a new order
 */
export async function createOrder(data: {
  userId: string;
  productId: string;
  quantity: number;
  type: IOrder['type'];
  customerNote?: string;
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
      unitPrice: product.price
    });
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: IOrder['status'],
  note?: string
): Promise<IOrder | null> {
  try {
    return await OrderRepository.updateOrderStatus(id, status, note);
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
): Promise<{ orders: IOrder[], total: number }> {
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
  status: string,
  customerNote?: string,
  type?: string
}): { 
  statusText: string, 
  statusEmoji: string,
  statusColor: string,
  explanation: string 
} {
  let statusEmoji = "⌛";
  let statusText = order.status;
  let statusColor = "#f5a623"; // Default amber color for pending
  let explanation = "";
  
  switch (order.status) {
    case "completed":
      statusEmoji = "✅";
      statusText = "Completed";
      statusColor = "#4CAF50"; // Green
      explanation = "Your order has been completed and delivered";
      break;
    case "cancelled":
      statusEmoji = "❌";
      statusText = "Cancelled";
      statusColor = "#F44336"; // Red
      explanation = "This order has been cancelled";
      break;
    case "pending":
      // Check if it's a pre-order
      if (order.type === "preorder" || (order.customerNote && order.customerNote.toLowerCase().includes("preorder"))) {
        statusEmoji = "⏳";
        statusText = "Pre-ordered";
        statusColor = "#2196F3"; // Blue
        explanation = "Pre-order received. You'll be notified when the product is available";
      } else {
        statusEmoji = "⌛";
        statusText = "Pending";
        explanation = "Your order is being processed";
      }
      break;
    case "failed":
      statusEmoji = "❌";
      statusText = "Failed";
      statusColor = "#F44336"; // Red
      explanation = "Order processing failed. Please contact support";
      break;
    default:
      explanation = "Status unknown. Please contact support";
  }
  
  return { statusText, statusEmoji, statusColor, explanation };
}

/**
 * Fulfill an order with digital content
 */
export async function fulfillOrder(
  id: string,
  content: string | string[] | any,
  note?: string
): Promise<IOrder | null> {
  try {
    // Handle different content formats (string, array, or object with content property)
    let contentStr: string;
    
    if (typeof content === 'string') {
      contentStr = content;
    } else if (Array.isArray(content)) {
      contentStr = content.join(',');
    } else if (content && typeof content === 'object' && content.content) {
      // Extract from object if the content is nested in a 'content' property
      contentStr = typeof content.content === 'string' ? content.content : 
                  Array.isArray(content.content) ? content.content.join(',') : 
                  JSON.stringify(content.content);
    } else {
      throw new Error('Digital content is required for order fulfillment and must be a string, array, or object with content property');
    }
    
    // Validate content is not empty after processing
    if (contentStr.trim() === '') {
      throw new Error('Digital content cannot be empty');
    }

    const order = await OrderRepository.findOrderById(id);
    if (!order) return null;

    // Get product details for the notification
    const product = await ProductRepository.findProductById(order.productId);
    if (!product) {
      throw new Error('Product not found for this order');
    }
    
    // Parse digital content (assuming content is in email:password format)
    const contentItems = contentStr.split(',').map(item => item.trim());
    
    // Store digital content in the order history
    const contentNote = `Order fulfilled with digital content. Content: ${contentStr}`;
    const updatedOrder = await OrderRepository.updateOrderStatus(
      id,
      'completed',
      contentNote
    );
    
    // Send digital content via Telegram
    try {
      // Convert userId to number
      const userIdNum = parseInt(order.userId, 10);
      
      // Format message with proper formatting for digital content
      let message = `
🎮 *YOUR ORDER IS FULFILLED!*

*Order ID:* #${id.slice(-6)}
*Product:* ${product.name}

🔐 *YOUR DIGITAL PRODUCT DETAILS*

Here are your login details:

`;
      
      // Add each digital content item
      contentItems.forEach((item, index) => {
        try {
          // Try to split into email:password format
          const [email, password] = item.split(':');
          message += `*Item ${index + 1}:*\n`;
          message += `Email: \`${email}\`\n`;
          message += `Password: \`${password}\`\n\n`;
        } catch (e) {
          // Fallback if splitting fails
          message += `*Item ${index + 1}:* \`${item}\`\n\n`;
        }
      });

      await bot.api.sendMessage(
        userIdNum,
        message,
        { parse_mode: "Markdown" }
      );
    } catch (error) {
      console.error("Error sending fulfillment message to user:", error);
    }

    return updatedOrder;
  } catch (error) {
    console.error(`Error fulfilling order ${id}:`, error);
    throw error;
  }
}

export async function syncOrderStatusWithPayments(): Promise<{ updated: number; errors: number }> {
  // Replace the following with actual logic
  const updated = 0; // Example: Number of orders updated
  const errors = 0;  // Example: Number of errors encountered
  return { updated, errors };
}

