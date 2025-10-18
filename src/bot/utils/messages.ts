/**
 * Centralized message constants
 * All user-facing messages should be defined here for consistency and easier localization
 */

// Welcome messages
export const WELCOME_MESSAGE = "Welcome to GameKey Store! 🎮";
export const WELCOME_BACK_MESSAGE = "Welcome back to GameKey Store! 🎮";

// Registration messages
export const TERMS_MESSAGE = "📜 **Terms of Service**\n\nPlease read and accept our terms of service to continue.";
export const TERMS_ACCEPTED = "✅ Terms accepted. Your account is being reviewed.";
export const TERMS_REJECTED = "❌ You need to accept the terms to use our services.";

// Support messages
export const SUPPORT_INTRO = "How can we help you today?";
export const SUPPORT_REQUEST_RECEIVED = "Your support request has been received. Our team will contact you shortly.";

// Order messages
export const ORDER_CREATED = "✅ Your order has been created successfully!";
export const ORDER_DETAILS = "Order details:";
export const NO_ORDERS = "You don't have any orders yet. Browse our products with /products";
export const ORDER_PAYMENT_PENDING = "⏳ Your payment is being processed.";
export const ORDER_COMPLETED = "✅ Your order has been completed!";
export const ORDER_CANCELLED = "❌ This order has been cancelled.";

// Product messages
export const PRODUCT_NOT_FOUND = "Sorry, this product could not be found.";
export const PRODUCT_OUT_OF_STOCK = "Sorry, this product is currently out of stock.";
export const SELECT_PRODUCT_CATEGORY = "Please select a product category:";
export const SELECT_PRODUCT = "Select a product to view details:";

// Error messages
export const GENERIC_ERROR = "Sorry, an error occurred. Please try again later.";
export const SESSION_EXPIRED = "Your session has expired. Please start again with /start.";
export const INVALID_COMMAND = "Sorry, I don't understand that command.";
export const UNAUTHORIZED = "You are not authorized to use this command.";

// Payment messages
export const PAYMENT_INIT = "🔐 Preparing your payment...";
export const PAYMENT_SUCCESS = "✅ Payment successful!";
export const PAYMENT_FAILED = "❌ Payment failed. Please try again.";
export const PAYMENT_CANCELLED = "Payment cancelled by user.";
export const PAYMENT_PENDING = "Payment is pending confirmation.";

// Payment messages
export const PAYMENT_INSUFFICIENT_FUNDS = "Insufficient funds. Please complete payment first.";
export const PAYMENT_PROCESSING_SUCCESSFUL = "Payment processed successfully!";

/**
 * Enhanced utility functions for creating beautiful, consistent bot messages
 */

import { formatNumber, formatPrice } from "../../utils/formatters";

/**
 * Creates an enhanced branded header with beautiful design
 */
export function createHeader(title: string, icon: string = "🎮"): string {
  return `${icon} *GameKey Store* ${icon}\n` +
         `╭─────────────────────╮\n` +
         `│     *${title}*     │\n` +
         `╰─────────────────────╯\n`;
}

/**
 * Creates an enhanced branded footer with helpful information
 */
export function createFooter(): string {
  return `\n╭─────────────────────╮\n` +
         `│  🎮 GameKey Store   │\n` +
         `│  💬 Need help? /help │\n` +
         `╰─────────────────────╯`;
}

/**
 * Creates a section divider for better message structure
 */
export function createDivider(text?: string): string {
  if (text) {
    return `\n━━━ ${text} ━━━\n`;
  }
  return `\n━━━━━━━━━━━━━━━━━━━━━\n`;
}

/**
 * Creates a status indicator with appropriate emoji
 */
export function createStatusIndicator(status: string): string {
  const statusMap: { [key: string]: string } = {
    'available': '🟢 Available',
    'out_of_stock': '🔴 Out of Stock',
    'preorder': '🟡 Pre-order Only',
    'processing': '🟡 Processing',
    'completed': '🟢 Completed',
    'cancelled': '🔴 Cancelled',
    'pending': '🟡 Pending',
    'failed': '🔴 Failed'
  };
  
  return statusMap[status] || `⚪ ${status}`;
}

/**
 * Formats an error message consistently
 * @param message Error message to display
 */
export function errorMessage(message: string): string {
  return `${createHeader("Error")}❌ ${message}${createFooter()}`;
}

/**
 * Formats a success message consistently
 * @param message Success message to display
 */
export function successMessage(message: string): string {
  return `${createHeader("Success")}✅ ${message}${createFooter()}`;
}

/**
 * Formats a notification message consistently
 * @param title Notification title
 * @param message Notification message to display
 */
export function notificationMessage(title: string, message: string): string {
  return `${createHeader(title)}📢 ${message}${createFooter()}`;
}

/**
 * Formats a warning message consistently
 * @param message Warning message to display
 */
export function warningMessage(message: string): string {
  return `${createHeader("Warning")}⚠️ ${message}${createFooter()}`;
}

/**
 * Creates a formatted profile display
 * @param user The user object with profile information
 */
export function formatProfileMessage(user: any): string {
  const accountStatus = user.isActive ? "✅ Active" : "❌ Inactive";
  
  return `${createHeader("User Profile")}
📛 *Name:* ${user.name || user.username || "Not Set"}

📦 *Orders:* ${formatNumber(user.orderCount || 0)} 

✅ *Account Status:* ${accountStatus}

${createFooter()}`;
}

/**
 * Creates a formatted product display
 * @param product The product object to display
 */
export function formatProductMessage(product: any): string {
  // Determine availability status
  const statusText = product.isAvailable 
    ? "✅ In Stock"
    : product.allowPreorder ? "⏳ Available for Pre-order" : "❌ Out of Stock";
    
  // Format the product description
  return `${createHeader(product.name)}
${statusText}

💬 *Description:*
${product.description || "No description available."}

💰 *Price:* ${formatPrice(product.price, 'USD')}

📋 *Category:* ${product.categoryName || "Uncategorized"}${createFooter()}`;
}

/**
 * Creates a formatted order summary
 * @param order The order object to display
 */
export function formatOrderMessage(order: any): string {
  // Format order date
  const orderDate = new Date(order.createdAt).toLocaleDateString();
  
  // Format order status with appropriate emoji
  let statusEmoji = "⏳";
  if (order.status === "completed") statusEmoji = "✅";
  if (order.status === "cancelled") statusEmoji = "❌";
  if (order.status === "refunded") statusEmoji = "💸";
  
  return `${createHeader(`Order #${order.orderId || order._id}`)}
${statusEmoji} *Status:* ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}

📅 *Date:* ${orderDate}

🏷️ *Product:* ${order.productName}

💰 *Amount:* $${formatNumber(order.amount)}${createFooter()}`;
}

/**
 * Creates an enhanced welcome message with better formatting
 * @param username The user's name or username
 */
export function formatWelcomeMessage(username: string): string {
  return `${createHeader("Welcome", "👋")}\n` +
         `*Hello, ${username}!* 🎉\n\n` +
         `Welcome to GameKey Store - your premier destination for gaming products!\n\n` +
         `${createDivider("Quick Start")}\n` +
         `🛍️ *Browse Products* - Discover amazing games\n` +
         `� *Secure Payments* - Fast & safe checkout\n` +
         `📦 *Order Tracking* - Monitor your purchases\n` +
         `🎯 *Instant Delivery* - Get your games immediately\n\n` +
         `${createDivider("Need Help?")}\n` +
         `Use the menu below or type /help for assistance\n` +
         `${createFooter()}`;
}

/**
 * Creates an enhanced product display with rich formatting
 * @param product The product object to display
 */
export function formatEnhancedProductMessage(product: any): string {
  const status = product.isAvailable 
    ? createStatusIndicator('available')
    : product.allowPreorder 
      ? createStatusIndicator('preorder') 
      : createStatusIndicator('out_of_stock');
  
  return `${createHeader(product.name, "🎮")}\n` +
         `${status}\n\n` +
         `${createDivider("Product Details")}\n` +
         `💰 *Price:* ${formatPrice(product.price, 'USD')}\n` +
         `📂 *Category:* ${product.categoryName || "Gaming"}\n` +
         `🆔 *Product ID:* ${product._id?.slice(-6) || 'N/A'}\n\n` +
         `${createDivider("Description")}\n` +
         `${product.description || "🎯 Premium gaming product - instant delivery after purchase!"}\n` +
         `${createFooter()}`;
}

/**
 * Creates an enhanced help message with comprehensive guidance
 */
export function formatHelpMessage(): string {
  return `${createHeader("Help Center", "❓")}\n` +
         `${createDivider("Basic Commands")}\n` +
         `🏠 */start* - Return to main menu\n` +
         `🛍️ */products* - Browse our catalog\n` +
         `📦 */orders* - View order history\n` +
         `👤 */profile* - Account information\n` +
         `💬 */support* - Contact customer service\n\n` +
         `${createDivider("How to Purchase")}\n` +
         `1️⃣ Browse products by category\n` +
         `2️⃣ Select your desired item\n` +
         `3️⃣ Choose quantity and payment method\n` +
         `4️⃣ Complete secure payment\n` +
         `5️⃣ Receive your product instantly!\n\n` +
         `${createDivider("Need More Help?")}\n` +
         `💬 Use the Help menu for detailed guides\n` +
         `📞 Contact support for personal assistance\n` +
         `${createFooter()}`;
}

/**
 * Creates FAQ content for common questions
 */
export function formatFAQMessage(): string {
  return `${createHeader("Frequently Asked Questions", "💡")}\n` +
         `${createDivider("Payment & Orders")}\n` +
         `*Q: What payment methods do you accept?*\n` +
         `A: We accept all major credit cards, bank transfers, and cryptocurrency.\n\n` +
         `*Q: How quickly will I receive my order?*\n` +
         `A: Digital products are delivered instantly after payment confirmation.\n\n` +
         `*Q: Can I get a refund?*\n` +
         `A: Yes! We offer refunds within 24 hours if there are any issues.\n\n` +
         `${createDivider("Account & Support")}\n` +
         `*Q: How do I track my orders?*\n` +
         `A: Use the "My Orders" button to see all your purchase history.\n\n` +
         `*Q: Is my payment information secure?*\n` +
         `A: Absolutely! We use enterprise-grade encryption for all transactions.\n` +
         `${createFooter()}`;
}

/**
 * Creates a user guide for new users
 */
export function formatUserGuideMessage(): string {
  return `${createHeader("User Guide", "📖")}\n` +
         `${createDivider("Getting Started")}\n` +
         `Welcome to GameKey! This guide will help you make your first purchase.\n\n` +
         `*Step 1: Browse Products* 🛍️\n` +
         `• Click "Browse Products" from the main menu\n` +
         `• Choose a category that interests you\n` +
         `• Browse available items\n\n` +
         `*Step 2: Select & Purchase* 🛒\n` +
         `• Click on any product to view details\n` +
         `• Choose "Buy Now" if you want to purchase\n` +
         `• Select your preferred payment method\n\n` +
         `*Step 3: Complete Payment* 💳\n` +
         `• Follow the secure payment link\n` +
         `• Complete your payment safely\n` +
         `• Return to confirm completion\n\n` +
         `*Step 4: Enjoy Your Purchase* 🎉\n` +
         `• Receive instant delivery of digital products\n` +
         `• Check "My Orders" to view purchase history\n` +
         `${createFooter()}`;
}

/**
 * Creates a formatted transaction confirmation
 * @param transaction The transaction details
 */
export function formatTransactionMessage(transaction: any): string {
  const txDate = new Date(transaction.createdAt).toLocaleDateString();
  
  return `${createHeader("Transaction Successful")}
✅ *Transaction ID:* ${transaction._id}

💰 *Amount:* $${formatNumber(transaction.amount)}

📅 *Date:* ${txDate}

📝 *Type:* ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}

Thank you for using GameKey!${createFooter()}`;
}
