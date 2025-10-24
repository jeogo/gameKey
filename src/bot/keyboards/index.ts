import { InlineKeyboard } from 'grammy';
import { ICategory } from '../../models/Category';
import { IProduct } from '../../models/Product';

/**
 * Simple keyboard factory - Essential keyboards only for fast performance
 */
class KeyboardFactory {
  /**
   * Simple main menu
   */
  static mainMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text('🛍️ Products', 'view_categories')
      .text('📋 Orders', 'view_orders')
      .row()
      .text('💬 Help', 'help_menu');
  }

  /**
   * Categories list
   */
  static categories(categories: ICategory[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    categories.forEach(category => {
      keyboard.text(`${category.name}`, `category_${category._id}`).row();
    });

    keyboard.text('⬅️ Back', 'main_menu');
    return keyboard;
  }

  /**
   * Products list
   */
  static products(products: IProduct[], categoryId: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    products.forEach(product => {
      const statusIcon = product.isAvailable ? '✅' : '❌';
      keyboard
        .text(`${statusIcon} ${product.name} - $${product.price}`, `product_${product._id}`)
        .row();
    });

    keyboard.text('⬅️ Back', `category_${categoryId}`);
    return keyboard;
  }

  /**
   * Simple back button
   */
  static backButton(callback: string, text: string = '⬅️ Back'): InlineKeyboard {
    return new InlineKeyboard().text(text, callback);
  }

  /**
   * Confirmation buttons
   */
  static confirmation(confirmCallback: string, cancelCallback: string): InlineKeyboard {
    return new InlineKeyboard()
      .text('✅ Confirm', confirmCallback)
      .text('❌ Cancel', cancelCallback);
  }

  /**
   * Missing essential methods - simplified versions
   */
  static backToMain(): InlineKeyboard {
    return new InlineKeyboard().text('🏠 Main Menu', 'main_menu');
  }

  static helpMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text('💬 Contact Support', 'contact_support')
      .row()
      .text('⬅️ Back', 'main_menu');
  }

  static support(): InlineKeyboard {
    return new InlineKeyboard()
      .text('💬 Contact Support', 'contact_support')
      .row()
      .text('⬅️ Back', 'main_menu');
  }

  static terms(): InlineKeyboard {
    return new InlineKeyboard()
      .text('✅ I Agree', 'accept_terms')
      .text('❌ Decline', 'decline_terms');
  }

  static profileMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text('📋 My Order History', 'view_orders')
      .row()
      .text('⬅️ Back', 'main_menu');
  }

  static ordersWithPagination(orders: any[], _page: number, _totalPages: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    orders.forEach(_order => {
      keyboard.text(`Order #${_order._id}`, `order_${_order._id}`).row();
    });
    return keyboard.text('⬅️ Back', 'main_menu');
  }

  static orderDetails(_order: any): InlineKeyboard {
    return new InlineKeyboard().text('⬅️ Back to Orders', 'view_orders');
  }

  static paymentLink(url: string, _transactionId: string): InlineKeyboard {
    return new InlineKeyboard().url('💳 Pay Now', url).row().text('⬅️ Back', 'main_menu');
  }

  static settingsMenu(): InlineKeyboard {
    return new InlineKeyboard()
      .text('🔔 Notifications', 'settings_notifications')
      .row()
      .text('⬅️ Back', 'main_menu');
  }

  static paymentConfirmation(
    productName: string,
    productId: string,
    quantity: number
  ): InlineKeyboard {
    return new InlineKeyboard()
      .text('✅ Confirm Purchase', `confirm_purchase_${productId}_${quantity}`)
      .text('❌ Cancel', 'main_menu');
  }

  // Alias for confirmation method
  static confirmationDialog(confirmCallback: string, cancelCallback: string): InlineKeyboard {
    return this.confirmation(confirmCallback, cancelCallback);
  }
}

export default KeyboardFactory;
