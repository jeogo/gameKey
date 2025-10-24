/**
 * GameKey Store Configuration
 * Simple and clear configuration for easy management
 */

export const BOT_CONFIG = {
  // Store Information
  STORE_NAME: '🎮 GameKey Store',
  STORE_DESCRIPTION: 'Digital Gaming Keys & Accounts',

  // Support Information
  SUPPORT_USERNAME: '@jeogo',
  SUPPORT_RESPONSE_TIME: 'Usually 1-2 hours',

  // Payment Methods
  PAYMENT_METHODS: [
    'USDT (Recommended)',
    'Bitcoin (BTC)', 
    'Ethereum (ETH)',
    'Litecoin (LTC)'
  ],

  // Simple Navigation Buttons
  BUTTONS: {
    SHOP: '🛒 Shop',
    ORDERS: '📦 Orders', 
    PROFILE: '👤 Profile',
    SUPPORT: '🆘 Support',
    BACK_TO_MENU: '🔙 Back',
  },

  // Simple Messages
  MESSAGES: {
    // Welcome Messages
    WELCOME_NEW_USER: `Welcome to {STORE_NAME}!

Digital Gaming Keys & Accounts

Please set up your account by choosing a username:

Type your username below:`,

    WELCOME_EXISTING_USER: `Welcome back to {STORE_NAME}!

Hi {username}!

• 🛒 Shop - Browse games
• 📦 Orders - View purchases  
• 👤 Profile - Account info
• 🆘 Support - Get help

Ready to shop?`,

    USERNAME_SUCCESS: `Account created successfully!

Welcome {username}!

Your account is ready. Use the buttons below to navigate.`,

    // Shop Messages
    SHOP_CATEGORIES: `{STORE_NAME} - Shop

Select a category to browse available games:`,

    SHOP_NO_CATEGORIES: `No categories available right now.

Please check back later or contact support at {SUPPORT_USERNAME}`,

    // Orders Messages  
    ORDERS_NO_ORDERS: `No orders found. Start shopping to see your orders here.`,

    ORDERS_HEADER: `Your Orders:

`,

    ORDER_ITEM: `Order #{orderNumber}
Product: {productName}
Price: {amount}
Date: {date}
Status: {status}

`,

    // Profile Messages
    PROFILE_HEADER: `My Profile:

`,
    PROFILE_INFO: `Username: {username}
Member Since: {joinDate}
Total Orders: {totalOrders}
Total Spent: {totalSpent}

Account Status: Active

Need help? Contact {SUPPORT_USERNAME}`,

    // 🆘 Professional Support Experience
    SUPPORT_INFO: `
🆘 **Professional Support Center**

━━━━━━━━━━━━━━━━━━━━
💬 **We're here to help, {username}!**
━━━━━━━━━━━━━━━━━━━━

📞 **Contact Information:**
┌─────────────────────────
│ 👨‍💼 **Support Agent:** {SUPPORT_USERNAME}
│ ⚡ **Response Time:** {SUPPORT_RESPONSE_TIME}
│ 🕐 **Availability:** {SUPPORT_AVAILABILITY}
│ 📧 **Email:** {SUPPORT_EMAIL}
└─────────────────────────

💡 **For Faster Support:**
✅ Include your username: **{username}**
✅ Mention order ID (if applicable)
✅ Describe issue clearly

🚀 **We'll resolve your issue quickly!**`,

    // ⚠️ Professional Error Handling
    ERROR_USER_NOT_FOUND: `Please create your account first. Use /start command to get started.`,

    ERROR_GENERIC: `Something went wrong. Please try again or contact support: {SUPPORT_USERNAME}`,

    ERROR_USERNAME_LENGTH: `Username must be 2-20 characters long. Please try again.`,

    UNKNOWN_COMMAND: `I don't understand that command. Please use the buttons below to navigate the store.`,

    PROCESSING: `Processing...`,
    LOADING_ORDERS: `Loading your orders...`,
    LOADING_PROFILE: `Loading profile...`,
    LOADING_SHOP: `Loading products...`,
  },

  // Settings
  SETTINGS: {
    USERNAME_MIN_LENGTH: 2,
    USERNAME_MAX_LENGTH: 20,
    ORDERS_PER_PAGE: 5,
    CURRENCY: 'USD',
  },
};

/**
 * Replace placeholders in messages with actual values
 */
export function formatMessage(
  messageKey: string,
  replacements: Record<string, string> = {}
): string {
  let message = BOT_CONFIG.MESSAGES[messageKey as keyof typeof BOT_CONFIG.MESSAGES] || messageKey;

  // Replace store info
  message = message.replace(/{STORE_NAME}/g, BOT_CONFIG.STORE_NAME);
  message = message.replace(/{SUPPORT_USERNAME}/g, BOT_CONFIG.SUPPORT_USERNAME);
  message = message.replace(/{SUPPORT_RESPONSE_TIME}/g, BOT_CONFIG.SUPPORT_RESPONSE_TIME);

  // Replace custom values
  Object.entries(replacements).forEach(([key, value]) => {
    message = message.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return message;
}
