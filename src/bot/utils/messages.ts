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

// GCoin messages
export const GCOIN_BALANCE = "Your current GCoin balance is:";
export const GCOIN_INSUFFICIENT = "Insufficient GCoin balance. Please add more GCoin.";
export const GCOIN_ADDED = "GCoin added successfully to your account!";
export const GCOIN_DEDUCTED = "GCoin deducted from your account for purchase.";

// Referral messages
export const REFERRAL_LINK = "Share this link to invite friends:";
export const REFERRAL_BONUS_EARNED = "You earned a referral bonus!";
export const REFERRAL_WELCOME = "Welcome! You've been invited by a friend.";

/**
 * Utility functions for formatting bot messages consistently
 */

import { formatGcoin, formatNumber, formatPrice } from "../../utils/formatters";

/**
 * Creates a branded header for all bot messages
 */
export function createHeader(title: string): string {
  return `🌟 *GameKey* 🌟\n━━━━━━━━━━━━━━\n*${title}*\n`;
}

/**
 * Creates a branded footer for all bot messages
 */
export function createFooter(): string {
  return "\n━━━━━━━━━━━━━━\n🔹 *GameKey Bot* - Your Gaming Marketplace";
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
 * @param referralLink The user's referral link
 */
export function formatProfileMessage(user: any, referralLink: string): string {
  const accountStatus = user.isActive ? "✅ Active" : "❌ Inactive";
  
  return `${createHeader("User Profile")}
📛 *Name:* ${user.name || user.username || "Not Set"}

💰 *Balance:* ${formatGcoin(user.gcoinBalance)}

💵 *Total Recharged:* ${formatGcoin(user.totalRecharge || 0)}

📦 *Orders:* ${formatNumber(user.orderCount || 0)} 

✅ *Account Status:* ${accountStatus}

🔗 *Referral Link:*
\`${referralLink}\`
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

💰 *Price:* ${formatPrice(product.gcoinPrice)}

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

💰 *Amount:* ${formatGcoin(order.amount)}${createFooter()}`;
}

/**
 * Creates a formatted welcome message
 * @param username The user's name or username
 */
export function formatWelcomeMessage(username: string): string {
  return `${createHeader("Welcome")}👋 Hello, *${username}*!

Welcome to GameKey - your one-stop marketplace for gaming products.

🎮 Browse our *Products*
💰 Buy with *GCoin*
📦 Track your *Orders*
👥 Invite friends with *Referrals*

Need help? Use /help command or contact our support team.${createFooter()}`;
}

/**
 * Creates a formatted help message
 */
export function formatHelpMessage(): string {
  return `${createHeader("Help & Commands")}
Here are the available commands:

/start - Start the bot and see welcome message
/menu - Show main menu with all options
/profile - View your profile information
/products - Browse available products
/orders - View your order history
/gcoin - Manage your GCoin balance
/referrals - Access your referral program
/help - Show this help message
/support - Contact customer support${createFooter()}`;
}

/**
 * Creates a formatted transaction confirmation
 * @param transaction The transaction details
 */
export function formatTransactionMessage(transaction: any): string {
  const txDate = new Date(transaction.createdAt).toLocaleDateString();
  
  return `${createHeader("Transaction Successful")}
✅ *Transaction ID:* ${transaction._id}

💰 *Amount:* ${formatGcoin(transaction.amount)}

📅 *Date:* ${txDate}

📝 *Type:* ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}

Thank you for using GameKey!${createFooter()}`;
}

/**
 * Creates a formatted referral statistics message
 * @param referralStats The referral statistics to display
 */
export function formatReferralStatsMessage(referralStats: any): string {
  return `${createHeader("Referral Statistics")}
👥 *Total Referrals:* ${formatNumber(referralStats.totalReferrals)}

✅ *Active Referrals:* ${formatNumber(referralStats.activeReferrals)}

💰 *Earnings:* ${formatGcoin(referralStats.totalEarnings)}

Keep sharing your referral link to earn more rewards!${createFooter()}`;
}
