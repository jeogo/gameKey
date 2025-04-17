import { Bot } from "grammy";
import { MyContext } from "../types/session";
import * as CategoryRepository from "../../repositories/CategoryRepository";
import * as ProductRepository from "../../repositories/ProductRepository";
import KeyboardFactory from "../keyboards";
import { PurchaseService } from "../services/PurchaseService";

/**
 * Show all product categories
 */
export async function showCategories(ctx: MyContext): Promise<void> {
  try {
    const categories = await CategoryRepository.findAllCategories();
    
    if (categories.length === 0) {
      if (ctx.callbackQuery) {
        await ctx.editMessageText("No product categories available at the moment.");
      } else {
        await ctx.reply("No product categories available at the moment.");
      }
      return;
    }
    
    const categoriesText = "*📂 Product Categories*\n\nPlease select a category to browse:";
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(categoriesText, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.categories(categories)
      });
    } else {
      await ctx.reply(categoriesText, {
        parse_mode: "Markdown",
        reply_markup: KeyboardFactory.categories(categories)
      });
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    const errorMsg = "Sorry, an error occurred while retrieving product categories.";
    if (ctx.callbackQuery) {
      await ctx.editMessageText(errorMsg);
    } else {
      await ctx.reply(errorMsg);
    }
  }
}

/**
 * Show products in a specific category
 */
export async function showProductsInCategory(ctx: MyContext, categoryId: string, offset = 0): Promise<void> {
  try {
    const category = await CategoryRepository.findCategoryById(categoryId);
    
    if (!category) {
      await ctx.editMessageText("Category not found. Please choose from available categories:", {
        reply_markup: KeyboardFactory.categories([])
      });
      return;
    }
    
    const products = await ProductRepository.findProducts({ categoryId: categoryId });
    
    if (products.length === 0) {
      await ctx.editMessageText(`No products found in ${category.name}. Please choose another category:`, {
        reply_markup: KeyboardFactory.categories([category])
      });
      return;
    }
    
    // Get paginated products
    const pageSize = 10;
    const paginatedProducts = products.slice(offset, offset + pageSize);
    
    const productsText = `*${category.name} - Products*\n\nPlease select a product to view details:`;
    
    await ctx.editMessageText(productsText, {
      parse_mode: "Markdown",
      reply_markup: KeyboardFactory.products(paginatedProducts, categoryId)
    });
  } catch (error) {
    console.error("Error fetching products for category:", error);
    await ctx.editMessageText("Sorry, an error occurred while retrieving products.");
  }
}

/**
 * Show details for a specific product
 */
export async function showProductDetails(ctx: MyContext, productId: string): Promise<void> {
  try {
    const product = await ProductRepository.findProductById(productId);
    
    if (!product) {
      await ctx.editMessageText("Product not found. Please choose from available products:", {
        reply_markup: KeyboardFactory.categories([])
      });
      return;
    }
    
    // حساب حالة المنتج
    const availability = product.isAvailable 
      ? "✅ In Stock"
      : (product.allowPreorder ? "⏳ Available for Pre-order" : "❌ Out of Stock");
    
    // حساب الكمية المتوفرة
    const quantity = product.isAvailable 
      ? (product.digitalContent?.length || 0)
      : 0;
    
    const productDetails = `
*${product.name}*

📝 *Description:* ${product.description || "No description available."}

💰 *Price:* $${product.price}
📦 *Status:* ${availability}
🔢 *Available Quantity:* ${quantity}
${product.allowPreorder && !product.isAvailable ? `\n⏳ *Pre-order Note:* ${product.preorderNote || "This item will be available soon."}` : ""}

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
  // Main products command - shows categories
  bot.command("products", async (ctx) => {
    await showCategories(ctx);
  });
  
  // Handle category selection
  bot.callbackQuery(/^category_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const categoryId = ctx.match[1];
      await showProductsInCategory(ctx, categoryId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing products:", error);
      await ctx.answerCallbackQuery("Error loading products. Please try again.");
    }
  });
  
  // Handle product selection
  bot.callbackQuery(/^product_(.+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const productId = ctx.match[1];
      await showProductDetails(ctx, productId);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error showing product details:", error);
      await ctx.answerCallbackQuery("Error loading product details. Please try again.");
    }
  });
  
  // Handle back to categories button
  bot.callbackQuery("view_categories", async (ctx) => {
    await showCategories(ctx);
    await ctx.answerCallbackQuery();
  });
  
  // Handle pagination for products
  bot.callbackQuery(/^next_products_(.+)_(\d+)$/, async (ctx) => {
    if (!ctx.from) return await ctx.answerCallbackQuery("User not found");
    
    try {
      const categoryId = ctx.match[1];
      const offset = parseInt(ctx.match[2]);
      await showProductsInCategory(ctx, categoryId, offset);
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Error loading more products:", error);
      await ctx.answerCallbackQuery("Error loading more products. Please try again.");
    }
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
