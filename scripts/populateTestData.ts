#!/usr/bin/env ts-node

/**
 * Script to populate GameKey database with fake test data
 * Run with: npx ts-node scripts/populateTestData.ts
 */

import { connectToDatabase, getDb } from '../src/database/connection';
import * as CategoryRepository from '../src/repositories/CategoryRepository';
import * as ProductRepository from '../src/repositories/ProductRepository';
import * as UserRepository from '../src/repositories/UserRepository';
import * as OrderRepository from '../src/repositories/OrderRepository';

// Fake digital content generators
const generateXboxGamePassAccounts = (count: number): string[] => {
  const accounts = [];
  for (let i = 1; i <= count; i++) {
    accounts.push(`xboxgamer${i}@outlook.com:XboxPass${i}2024!`);
  }
  return accounts;
};

const generatePlayStationAccounts = (count: number): string[] => {
  const accounts = [];
  for (let i = 1; i <= count; i++) {
    accounts.push(`psgamer${i}@gmail.com:PSN${i}Gaming2024`);
  }
  return accounts;
};

const generateSteamKeys = (count: number): string[] => {
  const keys = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 1; i <= count; i++) {
    let key = '';
    for (let j = 0; j < 15; j++) {
      if (j > 0 && j % 5 === 0) key += '-';
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    keys.push(key);
  }
  return keys;
};

const generateNetflixAccounts = (count: number): string[] => {
  const accounts = [];
  for (let i = 1; i <= count; i++) {
    accounts.push(`netflixuser${i}@email.com:Netflix${i}Stream!`);
  }
  return accounts;
};

const generateSpotifyAccounts = (count: number): string[] => {
  const accounts = [];
  for (let i = 1; i <= count; i++) {
    accounts.push(`musiclover${i}@email.com:Spotify${i}Music#`);
  }
  return accounts;
};

async function populateDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await connectToDatabase();
    
    console.log('🗑️ Clearing existing data...');
    // Clear existing data (be careful in production!)
    await connectToDatabase();
    const database = getDb();
    await database.collection('categories').deleteMany({});
    await database.collection('products').deleteMany({});
    await database.collection('orders').deleteMany({});
    
    console.log('📂 Creating categories...');
    
    // Create categories
    const categories = [
      {
        name: "🎮 Gaming Subscriptions",
        description: "Premium gaming subscriptions and memberships"
      },
      {
        name: "🎵 Streaming Services", 
        description: "Music and video streaming platforms"
      },
      {
        name: "🔑 Game Keys",
        description: "Digital game keys and licenses"
      },
      {
        name: "👤 Gaming Accounts",
        description: "Pre-configured gaming accounts with content"
      }
    ];

    const createdCategories = await Promise.all(
      categories.map(cat => CategoryRepository.createCategory({
        name: cat.name,
        description: cat.description
      }))
    );

    console.log('🎯 Creating products...');

    // Gaming Subscriptions Products
    const gamingSubsCategory = createdCategories[0];
    const streamingCategory = createdCategories[1]; 
    const gameKeysCategory = createdCategories[2];
    const accountsCategory = createdCategories[3];

    const products = [
      // Gaming Subscriptions
      {
        name: "Xbox Game Pass Ultimate (1 Month)",
        description: "Access 100+ high-quality games, Xbox Live Gold, EA Play, and cloud gaming. Instant delivery!",
        price: 14.99,
        digitalContent: generateXboxGamePassAccounts(25),
        categoryId: gamingSubsCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { duration: "30 days", region: "Global" }
      },
      {
        name: "Xbox Game Pass Ultimate (3 Months)", 
        description: "3 months of premium Xbox gaming with Game Pass Ultimate. Best value!",
        price: 39.99,
        digitalContent: generateXboxGamePassAccounts(15),
        categoryId: gamingSubsCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { duration: "90 days", region: "Global" }
      },
      {
        name: "PlayStation Plus Premium (1 Month)",
        description: "PS Plus Premium with 700+ games, classic games, and game trials. Instant access!",
        price: 17.99,
        digitalContent: generatePlayStationAccounts(20),
        categoryId: gamingSubsCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { duration: "30 days", region: "US/EU" }
      },
      
      // Streaming Services
      {
        name: "Netflix Premium (1 Month)",
        description: "4K streaming, 4 screens, unlimited movies and shows. Premium account ready to use!",
        price: 19.99,
        digitalContent: generateNetflixAccounts(30),
        categoryId: streamingCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { quality: "4K UHD", screens: "4 devices" }
      },
      {
        name: "Spotify Premium (1 Month)",
        description: "Ad-free music, offline downloads, unlimited skips. High quality audio!",
        price: 9.99,
        digitalContent: generateSpotifyAccounts(40),
        categoryId: streamingCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { quality: "320kbps", downloads: "Unlimited" }
      },
      
      // Game Keys  
      {
        name: "Cyberpunk 2077 (Steam Key)",
        description: "Epic open-world action-adventure RPG. Steam activation key for PC.",
        price: 29.99,
        digitalContent: generateSteamKeys(50),
        categoryId: gameKeysCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { platform: "Steam", region: "Global" }
      },
      {
        name: "Call of Duty: Modern Warfare III", 
        description: "Latest COD with multiplayer and Zombies. Battle.net activation.",
        price: 49.99,
        digitalContent: generateSteamKeys(25),
        categoryId: gameKeysCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { platform: "Battle.net", region: "Global" }
      },
      {
        name: "FIFA 24 (Origin Key)",
        description: "Latest FIFA with Ultimate Team and Career Mode. EA Origin activation.",
        price: 39.99,
        digitalContent: generateSteamKeys(35),
        categoryId: gameKeysCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { platform: "Origin", region: "Global" }
      },
      
      // Gaming Accounts
      {
        name: "Fortnite Account (100+ Skins)",
        description: "Loaded Fortnite account with 100+ rare skins, emotes, and V-Bucks. Instant delivery!",
        price: 89.99,
        digitalContent: generatePlayStationAccounts(10),
        categoryId: accountsCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { skins: "100+", vbucks: "2000+", rarity: "Multiple Rare" }
      },
      {
        name: "Steam Account (50+ Games)",
        description: "Steam account with 50+ popular games including GTA V, CS2, and more!",
        price: 199.99,
        digitalContent: generateXboxGamePassAccounts(5),
        categoryId: accountsCategory._id!,
        allowPreorder: false,
        isAvailable: true,
        additionalInfo: { games: "50+", value: "$500+", level: "10+" }
      }
    ];

    // Create all products
    const createdProducts = await Promise.all(
      products.map(product => ProductRepository.createProduct({
        name: product.name,
        description: product.description,
        price: product.price,
        digitalContent: product.digitalContent,
        categoryId: product.categoryId,

        isAvailable: product.isAvailable,

      }))
    );

    console.log('👥 Creating test users...');
    
    // Create some test users
    const testUsers = [
      { telegramId: 123456789, username: "testgamer1" },
      { telegramId: 987654321, username: "testgamer2" }, 
      { telegramId: 555666777, username: "testgamer3" }
    ];

    const createdUsers = await Promise.all(
      testUsers.map(user => UserRepository.createOrUpdateUser({
        telegramId: user.telegramId,
        username: user.username
      }))
    );

    console.log('📦 Creating sample orders...');
    
    // Create some sample orders for testing Historic section
    const sampleOrders = [
      {
        userId: createdUsers[0]._id!,
        productId: createdProducts[0]._id!,
        quantity: 1,
        unitPrice: createdProducts[0].price,
        type: 'purchase' as const
      },
      {
        userId: createdUsers[0]._id!,
        productId: createdProducts[3]._id!,
        quantity: 1,
        unitPrice: createdProducts[3].price,
        type: 'purchase' as const
      },
      {
        userId: createdUsers[1]._id!,
        productId: createdProducts[5]._id!,
        quantity: 1,
        unitPrice: createdProducts[5].price,
        type: 'purchase' as const
      }
    ];

    await Promise.all(
      sampleOrders.map(order => OrderRepository.createOrder({
        userId: order.userId,
        productId: order.productId,
        quantity: order.quantity,
        unitPrice: order.unitPrice,

      }))
    );

    console.log('\n✅ Database populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   📂 Categories: ${createdCategories.length}`);
    console.log(`   🎯 Products: ${createdProducts.length}`);
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   📦 Orders: ${sampleOrders.length}`);
    console.log('\n🚀 You can now test the bot with realistic data!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateDatabase();
}

export { populateDatabase };