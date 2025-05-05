import { InlineKeyboard } from "grammy";
import { ICategory } from "../../models/Category";
import { IProduct } from "../../models/Product";
import { IOrder } from "../../models/Order";

/**
 * Factory for creating inline keyboards used throughout the bot
 * Using consistent styling and icons for better UX
 */
class KeyboardFactory {
  static backToMain(): import("@grammyjs/types").InlineKeyboardMarkup | import("@grammyjs/types").ReplyKeyboardMarkup | import("@grammyjs/types").ReplyKeyboardRemove | import("@grammyjs/types").ForceReply | undefined {
      throw new Error("Method not implemented.");
  }
  static gcoinMenu(): import("@grammyjs/types").InlineKeyboardMarkup | undefined {
      throw new Error("Method not implemented.");
  }
  static backButton(arg0: string, arg1: string): import("@grammyjs/types").InlineKeyboardMarkup | undefined {
    throw new Error("Method not implemented.");
  }
  
  /**
   * Main menu keyboard with all primary options
   */
  static mainMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text("🛒 Products", "view_categories").text("📦 My Orders", "view_orders").row()
      .text("💰 GCoin Balance", "check_balance").text("👤 My Profile", "profile").row()
      .text("🔄 Recharge GCoin", "buy_gcoin").text("👥 Referrals", "view_referrals").row()
      .text("📞 Contact Support", "contact_support");
  }
  
  /**
   * Profile menu with profile-specific actions
   */
  static profileMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text("📥 Order History", "view_orders").text("📢 Invite Friends", "view_referrals").row()
      .text("🔄 Refresh Data", "refresh_profile").text("🏠 Main Menu", "main_menu");
  }

  /**
   * Categories selection keyboard
   */
  static categories(categories: ICategory[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Add a button for each category, 2 per row
    for (let i = 0; i < categories.length; i += 2) {
      const cat1 = categories[i];
      const cat2 = categories[i + 1];
      
      keyboard.text(`📁 ${cat1.name}`, `category_${cat1._id}`);
      
      if (cat2) {
        keyboard.text(`📁 ${cat2.name}`, `category_${cat2._id}`);
      }
      
      keyboard.row();
    }
    
    // Add navigation buttons
    keyboard.text("🏠 Main Menu", "main_menu");
    
    return keyboard;
  }
  
  /**
   * Products list keyboard for a specific category
   */
  static products(products: IProduct[], categoryId: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Add a button for each product, 1 per row
    products.forEach(product => {
      // Add status icon based on availability
      const icon = product.isAvailable ? "✅" : (product.allowPreorder ? "⏳" : "❌");
      keyboard.text(`${icon} ${product.name} - ${product.gcoinPrice} GCoin`, `product_${product._id}`).row();
    });
    
    // Add navigation buttons
    keyboard.text("⬅️ Back to Categories", "view_categories").row()
      .text("🏠 Main Menu", "main_menu");
    
    return keyboard;
  }
  
  /**
   * Product detail keyboard with purchase options
   */
  static productDetail(product: IProduct): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Only show purchase button if product is available or allows preorders
    if (product.isAvailable || product.allowPreorder) {
      keyboard.text("🛒 Purchase Now", `purchase_${product._id}`).row();
    }
    
    // Add navigation buttons
    keyboard.text("⬅️ Back to Products", `category_${product.categoryId}`).row()
      .text("🏠 Main Menu", "main_menu");
    
    return keyboard;
  }
  
  /**
   * GCoin purchase options keyboard
   */
  static gcoinPurchaseOptions(): InlineKeyboard {
    return new InlineKeyboard()
      .text("💰 100 GCoin", "buy_gcoin_100").text("💰 200 GCoin", "buy_gcoin_200").row()
      .text("💰 500 GCoin", "buy_gcoin_500").text("💰 1000 GCoin", "buy_gcoin_1000").row()
      .text("💰 Custom Amount", "buy_gcoin_custom").row()
      .text("🏠 Main Menu", "main_menu");
  }

  /**
   * Payment link keyboard
   */
  static paymentLink(paymentUrl: string | undefined, transactionId: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    if (paymentUrl) {
      keyboard.url("💳 Pay Now", paymentUrl).row();
    }
    keyboard.text("✅ Confirm Payment", `check_payment_${transactionId}`).row();
    keyboard.text("❌ Cancel Order", `cancel_payment_${transactionId}`);
    return keyboard;
  }

  /**
   * Transactions with pagination keyboard
   */
  static transactionsWithPagination(currentPage: number, totalPages: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    if (totalPages > 1) {
      if (currentPage > 1) {
        keyboard.text("⬅️ Previous", `transactions_page_${currentPage - 1}`);
      }
      keyboard.text(`${currentPage} / ${totalPages}`, `current_page_info`);
      if (currentPage < totalPages) {
        keyboard.text("Next ➡️", `transactions_page_${currentPage + 1}`);
      }
      keyboard.row();
    }
    keyboard.text("🔙 Back", "my_gcoin");
    return keyboard;
  }

  /**
   * GCoin balance keyboard
   */
  static gcoinBalance(balance: number): InlineKeyboard {
    return new InlineKeyboard()
      .text("💰 Buy More GCoin", "buy_gcoin").row()
      .text("📋 Transaction History", "gcoin_transactions").row()
      .text("🔙 Back to Main Menu", "main_menu");
  }
  
  /**
   * Confirm GCoin purchase keyboard
   */
  static confirmGcoinPurchase(productId: string, quantity: number = 1): InlineKeyboard {
    return new InlineKeyboard()
      .text("✅ Confirm Purchase", `confirm_gcoin_purchase_${productId}_${quantity}`).row()
      .text("❌ Cancel", "cancel_purchase");
  }

  /**
   * Referral menu keyboard
   */
  static referralMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text("🔗 Get Referral Link", "get_referral_link").row()
      .text("📊 Referral Statistics", "referral_stats").row()
      .text("🔙 Back to Main Menu", "main_menu");
  }

  /**
   * Terms and conditions keyboard
   */
  static terms(): InlineKeyboard {
    return new InlineKeyboard()
      .text("I Accept the Terms", "accept_terms").row()
      .text("I Decline", "decline_terms");
  }

  /**
   * Support options keyboard
   */
  static support(): InlineKeyboard {
    return new InlineKeyboard()
      .text("Contact Support", "contact_support").row()
      .text("Back to Main Menu", "main_menu");
  }

  /**
   * GCoin payment confirmation keyboard
   */
  static gcoinPaymentConfirmation(productName: string, productId: string, quantity: number): InlineKeyboard {
    return new InlineKeyboard()
      .text("✅ Yes, Pay with GCoin", `confirm_gcoin_purchase_${productId}_${quantity}`).row()
      .text("❌ No, Cancel", "cancel_purchase");
  }

  /**
   * Payment confirmation keyboard
   */
  static paymentConfirmation(productName: string, productId: string, quantity: number): InlineKeyboard {
    return new InlineKeyboard()
      .text("Yes, Complete Purchase", `confirm_purchase_${productId}_${quantity}`).row()
      .text("No, Cancel", "cancel_purchase");
  }
}

export default KeyboardFactory;
