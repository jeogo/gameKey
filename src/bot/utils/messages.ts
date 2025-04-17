/**
 * Static text messages used throughout the bot
 * Centralizing messages makes it easier to maintain and update them
 */

export const messages = {
  // Welcome and registration messages
  welcome: `
Welcome to our Digital Store! 🎮🎬

You can browse:
• 🎮 Digital Games
• 🎬 Subscription Services
• 📦 Track your orders
• 💬 Contact support

*How to use:*
1. Choose a category
2. Browse products
3. Select a product
4. Complete purchase
5. Receive your product instantly
`,

  terms: `
Welcome to our Digital Store! 🎮🎬

*Terms and Conditions:*
• You must be 18 years or older to use this service
• All products are digital and non-refundable
• Reselling of our products is prohibited
• We reserve the right to cancel accounts violating our terms

Do you agree to these terms and conditions?
`,

  pendingApproval: `Your registration is pending approval. Please wait for admin confirmation.`,
  
  registrationReceived: `
Your registration has been received! ✅

An administrator will review your request shortly.
You will be notified once your account is approved.
`,

  registrationRejected: `
Unfortunately, your registration was rejected. 

Possible reasons:
• Incomplete information
• Suspicious activity
• Previous terms violations

For more information, please contact support.
`,

  registrationApproved: `
Good news! Your account has been approved ✅

You now have full access to our digital store.
Use the menu below to start shopping.
`,

  // Error messages
  userNotFound: `Unable to identify user.`,
  notRegistered: `You don't have a profile yet. Use /start to register.`,
  pendingUser: `Your account is pending approval. Please wait for admin confirmation.`,
  
  // Help messages
  help: `
*Available Commands:*
/start - Start shopping and see main menu
/help - Show this help message
/orders - View your order history
/profile - View your profile information
/support - Contact customer support

*How to use the store:*
1. Browse categories and products
2. Select products you want to purchase
3. Complete payment
4. Receive your digital products instantly

Need more help? Use the /support command to contact us.
`,

  // Support messages
  support: `
*Need Help?*

For any questions or assistance with your orders, you can:

1. Check our FAQ section
2. Open a support ticket
3. Send us a direct message

Our support team is available 24/7 to assist you with any issues.
`,

  // Product and category messages
  noCategories: `No categories available in this section.`,
  noProducts: `No products available in this category.`,
  productNotFound: `Product not found or no longer available.`,
  
  // Order messages
  noOrders: `You don't have any orders yet. Use /start to browse products.`,
  orderCreated: `Your order has been successfully created! You'll receive your product shortly.`,
  
  // Payment messages
  paymentInstructions: `
Please complete your payment using one of the available methods.
Your order will be processed once payment is confirmed.
`,

  // Profile messages
  profileHeader: `
*Your Profile*

`,
};
