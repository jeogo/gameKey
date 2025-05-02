import { InlineKeyboard } from "grammy";
import { IOrder } from "../../models/Order";
import { IProduct } from "../../models/Product";

/**
 * Centralized keyboard factory for the bot
 * All keyboard creation is managed here to avoid duplication
 */
export class KeyboardFactory {
  /**
   * Terms acceptance keyboard
   */
  static terms(): InlineKeyboard {
    return new InlineKeyboard()
      .text("✅ I Accept the Terms", "accept_terms")
      .row()
      .text("❌ I Decline", "decline_terms");
  }
  static custom(buttons: Array<Array<{ text: string, callback_data: string }>>) {
    return {
      inline_keyboard: buttons
    };}
  /**
   * Support keyboard
   */
  static support(): InlineKeyboard {
    return new InlineKeyboard()
      .text("📞 Contact Support", "contact_support")
      .row()
      .text("🔙 Back to Main Menu", "main_menu");
  }
  
  /**
   * Registration keyboard
   */
  static register(): InlineKeyboard {
    return new InlineKeyboard().text("🔄 Register", "register");
  }

  /**
   * Admin approval keyboard
   */
  static adminApproval(userId: number): InlineKeyboard {
    return new InlineKeyboard()
      .text("✅ Approve", `approve_user_${userId}`)
      .text("❌ Decline", `decline_user_${userId}`);
  }
  
  /**
   * Categories keyboard - displays product categories
   */
  static categories(categories: Array<{_id?: string, name: string}>): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    categories.forEach(category => {
      keyboard.text(`📁 ${category.name}`, `category_${category._id}`).row();
    });
    
    keyboard.text("🔙 Back to Main Menu", "main_menu");
    
    return keyboard;
  }
  
  /**
   * Products keyboard - displays products in a category
   */
  static products(products: Array<{_id?: string, name: string, price: number}>, categoryId: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Display products in a responsive grid (up to 10 per page)
    const maxToDisplay = Math.min(products.length, 10);
    
    for (let i = 0; i < maxToDisplay; i++) {
      const product = products[i];
      keyboard.text(` ${product.name}`, `product_${product._id}`).row();
    }
    
    // Add navigation if needed
    if (products.length > 10) {
      keyboard.text("⏩ Next Page", `next_products_${categoryId}_10`);
    }
    
    keyboard.row().text("🔙 Back to Categories", "view_categories");
    
    return keyboard;
  }
  
  /**
   * Orders keyboard - displays user orders
   */
  static orders(orders: Array<{_id?: string}>): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    if (orders.length === 0) {
      return keyboard.text("🔙 Back to Main Menu", "main_menu");
    }
    
    // Show up to 5 most recent orders
    const recentOrders = orders.slice(0, 5);
    
    recentOrders.forEach(order => {
      if (order._id) {
        keyboard.text(`🧾 Order #${order._id.slice(-6)}`, `order_${order._id}`).row();
      }
    });
    
    keyboard.text("🔙 Back to Main Menu", "main_menu");
    
    return keyboard;
  }

  /**
   * Orders keyboard with pagination - displays user orders with next/previous buttons
   */
  static ordersWithPagination(orders: Array<{_id?: string}>, currentPage: number, totalPages: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Show orders
    orders.forEach(order => {
      if (order._id) {
        keyboard.text(`🧾 Order #${order._id.slice(-6)}`, `order_${order._id}`).row();
      }
    });
    
    // Add pagination row if needed
    if (totalPages > 1) {
      // Add previous button if not on first page
      if (currentPage > 1) {
        keyboard.text(`⬅️ Previous`, `orders_page_${currentPage - 1}`);
      }
      
      // Add page indicator
      keyboard.text(`${currentPage} / ${totalPages}`, `current_page_info`);
      
      // Add next button if not on last page
      if (currentPage < totalPages) {
        keyboard.text(`Next ➡️`, `orders_page_${currentPage + 1}`);
      }
      
      keyboard.row();
    }
    
    // Add back to main menu button
    keyboard.text("🔙 Back to Main Menu", "main_menu");
    
    return keyboard;
  }

  /**
   * Generic back button with customizable text
   */
  static backButton(destination: string, label: string = "Back"): InlineKeyboard {
    return new InlineKeyboard().text(`🔙 ${label}`, destination);
  }

  /**
   * Back to main menu keyboard
   */
  static backToMain(): InlineKeyboard {
    return new InlineKeyboard().text("🔙 Back to Main Menu", "main_menu");
  }
  
  /**
   * Order details keyboard with support option
   */
  static orderDetails(order: IOrder): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Only show support option if order exists
    if (order._id) {
      keyboard.text("🎫 Get Support for this Order", `support_order_${order._id}`);
    }
    
    keyboard.row().text("🔙 Back to Orders", "my_orders");
    
    return keyboard;
  }

  /**
   * Product detail keyboard - shows purchase & back buttons
   */
  static productDetail(product: IProduct): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Only show purchase/preorder button if product is available or can be preordered
    if (product.isAvailable || product.allowPreorder) {
      const buttonText = product.isAvailable ? "🛒 Purchase Now" : "⏳ Pre-order Now";
      keyboard.text(buttonText, `purchase_${product._id}`).row();
    }
    
    // Add back button to return to category
    keyboard.text("🔙 Back to Products", "category_" + product.categoryId);
    
    return keyboard;
  }

  /**
   * Payment confirmation keyboard with attractive styling
   */
  static paymentConfirmation(productName: string, productId: string, quantity: number): InlineKeyboard {
    return new InlineKeyboard()
      .text("✅ Yes, Complete Purchase", `confirm_purchase_${productId}_${quantity}`)
      .row()
      .text("❌ No, Cancel", "cancel_purchase");
  }

  /**
   * Payment link keyboard with attractively styled buttons
   */
  static paymentLink(paymentUrl: string, transactionId: string): InlineKeyboard {
    return new InlineKeyboard()
      .url("💳 Complete Payment Securely", paymentUrl)
      .row()
      .text("🔄 Check Payment Status", `check_payment_${transactionId}`)
      .row()
      .text("❓ Need Help?", "payment_support")
      .row()
      .text("🔙 Back to Main Menu", "main_menu");
  }
}

export default KeyboardFactory;
