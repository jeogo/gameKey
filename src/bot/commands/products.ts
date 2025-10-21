import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/session";
import * as CategoryRepository from "../../repositories/CategoryRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import * as UserRepository from "../../repositories/UserRepository";

/**
 * Helper function to safely edit or send messages, handling the "message not modified" error
 */
async function safeEditOrReply(
  ctx: MyContext, 
  message: string, 
  options?: { parse_mode?: "Markdown" | "HTML"; reply_markup?: any }
): Promise<void> {
  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(message, options);
    } catch (error: any) {
      // Handle "message not modified" error by sending a new message
      if (error?.description?.includes('message is not modified')) {
        console.log('Message content identical, sending new message instead');
        await ctx.reply(message, options);
      } else {
        throw error; // Re-throw other errors
      }
    }
  } else {
    await ctx.reply(message, options);
  }
}

export async function showCategories(ctx: MyContext): Promise<void> {
  try {
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Please use /start first.");
      return;
    }
    
    const categories = await CategoryRepository.findAllCategories();
    
    let message = `� **GAMEKEY DIGITAL STORE**\n`;
    message += `════════════════════\n\n`;
    message += `🎮 **Choose Your Gaming Category:**\n\n`;
    
    if (categories.length === 0) {
      message += `📭 No categories available right now.\n\nPlease check back later or contact support!`;
      
      const response = ctx.callbackQuery ? ctx.editMessageText : ctx.reply;
      await response(message, { parse_mode: "Markdown" });
      return;
    }
    
    // Create inline keyboard with category buttons - cleaner design
    const keyboard = new InlineKeyboard();
    
    for (const category of categories) {
      // Clean category name for better button text
      const cleanName = category.name.replace(/🎮|🎵|🔑|👤/g, '').trim();
      keyboard.text(`🎯 ${cleanName}`, `category_${category._id}`).row();
    }
    
    // Use safe edit or reply helper
    await safeEditOrReply(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply("❌ Error. Try again.");
  }
}

export async function showProductsInCategory(ctx: MyContext, categoryId: string): Promise<void> {
  try {
    console.log(`🔍 Looking for products in category: ${categoryId}`);
    const products = await ProductRepository.findProductsByCategoryId(categoryId);
    const category = await CategoryRepository.findCategoryById(categoryId);
    
    console.log(`📦 Found ${products.length} products in category "${category?.name}"`);
    
    let message = `🛒 **${category?.name || 'Products'}**\n`;
    message += `════════════════════\n\n`;
    
    if (products.length === 0) {
      message += `📭 **No products available**\n\n`;
      message += `🔄 Check back later for new arrivals!`;
      
      const keyboard = new InlineKeyboard()
        .text("🔙 Back to Categories", "back_to_categories");
      
      await safeEditOrReply(ctx, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      return;
    }
    
    message += `📦 **${products.length} Products Available**\n`;
    message += `💡 *Click any product for details:*\n\n`;
    
    // Create clean inline keyboard with product buttons
    const keyboard = new InlineKeyboard();
    
    for (const product of products) {
      const stockCount = product.digitalContent.length;
      
      // Status indicators for better UX
      let statusIcon = "";
      let priceDisplay = `$${product.price.toFixed(2)}`;
      
      if (stockCount > 10) {
        statusIcon = "🟢"; // Green dot for good stock
      } else if (stockCount > 0) {
        statusIcon = "🟡"; // Yellow dot for limited stock
      } else {
        statusIcon = "🔴"; // Red dot for out of stock
        priceDisplay += " (Out of Stock)";
      }
      
      // Shorter, cleaner button text
      const shortName = product.name.length > 30 ? product.name.substring(0, 30) + "..." : product.name;
      const buttonText = `${statusIcon} ${shortName} • ${priceDisplay}`;
      keyboard.text(buttonText, `product_${product._id}`).row();
    }
    
    // Better back button
    keyboard.text("🔙 Back to Categories", "back_to_categories");
    
    await safeEditOrReply(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error("Error showing products:", error);
    await ctx.reply("❌ Error loading products. Try again.");
  }
}

export async function showProductDetails(ctx: MyContext, productId: string): Promise<void> {
  try {
    const product = await ProductRepository.findProductById(productId);
    
    if (!product) {
      const keyboard = new InlineKeyboard()
        .text("← Back to Categories", "back_to_categories");
      
      await ctx.editMessageText("❌ Product not found.", {
        reply_markup: keyboard
      });
      return;
    }
    
    // Enhanced product details with modern design
    const stockCount = product.digitalContent.length;
    
    let message = `🎯 **${product.name}**\n`;
    message += `════════════════════\n\n`;
    
    // Status badge at the top
    if (stockCount > 10) {
      message += `� **IN STOCK** • Ready for instant delivery\n\n`;
    } else if (stockCount > 0) {
      message += `� **LIMITED STOCK** • Only ${stockCount} left!\n\n`;
    } else {
      message += `🔴 **OUT OF STOCK** • Currently unavailable\n\n`;
    }
    
    if (product.description) {
      message += `📝 **Description:**\n${product.description}\n\n`;
    }
    
    // Price display with better formatting
    message += `💰 **Price:** $${product.price.toFixed(2)}\n`;
    message += `⚡ **Delivery:** Instant Digital Delivery\n\n`;
    
    // Simplified Product model - additionalInfo removed
    
    // Simplified Product model - preorder functionality removed
    
    // Smart action buttons
    const keyboard = new InlineKeyboard();
    
    if (product.isAvailable && stockCount > 0) {
      keyboard.text("💳 BUY NOW", `purchase_${product._id}`).row();
    } else {
      keyboard.text("❌ OUT OF STOCK", "out_of_stock").row();
    }
    
    // Separate back button row for cleaner look
    keyboard.text("🔙 Back to Products", `category_${product.categoryId}`);
    
    await safeEditOrReply(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error("Error showing product details:", error);
    await ctx.reply("❌ Error loading product details.");
  }
}

export async function showPurchaseConfirmation(ctx: MyContext, productId: string): Promise<void> {
  try {
    const product = await ProductRepository.findProductById(productId);
    
    if (!product) {
      await safeEditOrReply(ctx, "❌ Product not found.");
      return;
    }
    
    if (product.digitalContent.length === 0) {
      const keyboard = new InlineKeyboard()
        .text("← Back to Product", `product_${product._id}`);
      
      await safeEditOrReply(ctx, 
        `❌ *${product.name}* is currently out of stock.\n\nPlease check back later!`,
        {
          parse_mode: "Markdown",
          reply_markup: keyboard
        }
      );
      return;
    }
    
    let message = `💳 **PURCHASE CONFIRMATION**\n`;
    message += `════════════════════\n\n`;
    
    message += `🎯 **Product:** ${product.name}\n`;
    message += `💰 **Price:** $${product.price.toFixed(2)} USD\n`;
    message += `⚡ **Delivery:** Instant Digital Delivery\n`;
    message += `📦 **Stock:** ${product.digitalContent.length} available\n\n`;
    
    message += `🔐 **SECURE CHECKOUT**\n`;
    message += `▫️ Cryptocurrency payment via NowPayments\n`;
    message += `▫️ Multiple crypto options available\n`;
    message += `▫️ Instant delivery after confirmation\n`;
    message += `▫️ Full customer support included\n\n`;
    
    message += `❓ **Ready to purchase?**\n`;
    message += `Payment will be processed securely through our crypto gateway.`;
    
    const keyboard = new InlineKeyboard()
      .text("💳 PROCEED TO PAYMENT", `confirm_purchase_${product._id}`).row()
      .text("🔙 Back to Product", `product_${product._id}`);
    
    await safeEditOrReply(ctx, message, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error("Error showing purchase confirmation:", error);
    await ctx.reply("❌ Error loading purchase confirmation.");
  }
}

export function registerProductsCommand(bot: Bot<MyContext>): void {
  // Main products command (legacy support)
  bot.command("products", async (ctx) => {
    await showCategories(ctx);
  });
  
  // Enhanced shop command (primary)
  bot.command("shop", async (ctx) => {
    await showCategories(ctx);
  });
  
  // Additional aliases for better UX
  bot.command("store", async (ctx) => {
    await showCategories(ctx);
  });
  
  bot.command("buy", async (ctx) => {
    await showCategories(ctx);
  });
}
