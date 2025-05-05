import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as CategoryRepository from "../../repositories/CategoryRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import KeyboardFactory from "../keyboards";
import * as UserRepository from "../../repositories/UserRepository";
import { PurchaseService } from "../services/PurchaseService";

/**
 * Show all product categories
 */
export async function showCategories(ctx: MyContext): Promise<void> {
  try {
    // First, verify user is accepted
    if (!ctx.from) return;
    
    const user = await UserRepository.findUserByTelegramId(ctx.from.id);
    if (!user) {
      await ctx.reply("Please use /start to register first.");
      return;
    }
    
    // Fetch categories
    const categories = await CategoryRepository.findAllCategories();
    
    // Format message and keyboard
    let message = "🏪 *Product Categories*\n\nChoose one of the following categories:";
    const keyboard = KeyboardFactory.categories(categories);
    
    // Determine response type (new message vs edit message)
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
  } catch (error) {
    console.error("Error showing categories:", error);
    await ctx.reply("Sorry, an error occurred while fetching product categories. Please try again later.");
  }
}

/**
 * Show products in a specific category
 */
export async function showProductsInCategory(ctx: MyContext, categoryId: string): Promise<void> {
  try {
    // Get products in the category
    const products = await ProductRepository.findProductsByCategoryId(categoryId);
    const category = await CategoryRepository.findCategoryById(categoryId);
    
    // Format message
    const categoryName = category?.name || "Unknown Category";
    let message = `📋 *Products in ${categoryName}*\n\nSelect a product to view details:`;
    
    // Create keyboard with products
    const keyboard = KeyboardFactory.products(products, categoryId);
    
    // Store current category ID in session
    ctx.session.currentCategoryId = categoryId;
    
    // Send or edit message based on context
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: "Markdown", 
        reply_markup: keyboard
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    
  } catch (error) {
    console.error("Error showing products in category:", error);
    await ctx.reply("Sorry, an error occurred while displaying products. Please try again later.");
  }
}

/**
 * Show details for a specific product
 */
export async function showProductDetails(ctx: MyContext, productId: string): Promise<void> {
  try {
    const product = await ProductRepository.findProductById(productId);
    
    if (!product) {
      await ctx.editMessageText("Product not found. Please select a product from the available products:", {
        reply_markup: KeyboardFactory.categories([])
      });
      return;
    }
    
    // Calculate product status
    const availability = product.isAvailable 
      ? "✅ Available"
      : (product.allowPreorder ? "⏳ Available for pre-order" : "❌ Not available");
    
    // Calculate available quantity
    const quantity = product.isAvailable 
      ? (product.digitalContent?.length || 0)
      : 0;
    
    const productDetails = `
*${product.name}*

📝 *Description:* ${product.description || "No description available."}

💰 *Price:* ${product.gcoinPrice} GCoin
📦 *Status:* ${availability}
🔢 *Available Quantity:* ${quantity}
${product.allowPreorder && !product.isAvailable ? `\n⏳ *Pre-order Note:* ${product.preorderNote || "This product will be available soon."}` : ""}

${product.additionalInfo ? `\n📋 *Additional Info:*\n${product.additionalInfo}` : ""}
`;
    
    await ctx.editMessageText(productDetails, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.productDetail(product)
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    await ctx.editMessageText("Sorry, an error occurred while retrieving product details.");
  }
}

/**
 * Handle the purchase of a product
 */
export async function purchaseProduct(ctx: MyContext, productId: string, quantity: number = 1): Promise<void> {
  const success = await PurchaseService.initiateProductPurchase(ctx, productId, quantity);
  
  if (!success) {
    // PurchaseService already handles error messages, but we can add a fallback here
    console.log("Purchase failed for product:", productId);
  }
}

export function registerProductsCommand(bot: Bot<MyContext>): void {
  // Show all categories
  bot.command("products", showCategories);
  bot.callbackQuery("view_categories", showCategories);
  
  // Show products in a specific category
  bot.callbackQuery(/^category_(.+)$/, async (ctx) => {
    const categoryId = ctx.match![1];
    await showProductsInCategory(ctx, categoryId);
  });
  
  // Show product details
  bot.callbackQuery(/^product_(.+)$/, async (ctx) => {
    const productId = ctx.match![1];
    await showProductDetails(ctx, productId);
    await ctx.answerCallbackQuery();
  });

  // Handle main menu button
  bot.callbackQuery("main_menu", async (ctx) => {
    await ctx.editMessageText(
      "Welcome to our Digital Store! Use the commands below to navigate:\n\n" +
      "/products - Browse products\n" +
      "/orders - View your orders\n" +
      "/support - Get help\n" +
      "/help - Show all commands"
    );
    await ctx.answerCallbackQuery();
  });

  // Handle purchase button
  bot.callbackQuery(/^purchase_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const productId = ctx.match[1];
      await purchaseProduct(ctx, productId);
      await ctx.answerCallbackQuery("Processing your purchase");
    } catch (error) {
      console.error("Error processing purchase:", error);
      await ctx.answerCallbackQuery("Error processing your purchase. Please try again.");
    }
  });
}
