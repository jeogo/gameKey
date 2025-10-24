/**
 * Database Setup and Test Data Population
 * This script fills the database with realistic test data for testing
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test data
const testCategories = [
  { name: 'PC Games', description: 'Digital PC game keys' },
  { name: 'Steam Accounts', description: 'Ready-to-use Steam accounts' },
  { name: 'Gift Cards', description: 'Gaming platform gift cards' },
  { name: 'Game Passes', description: 'Subscription services' }
];

const testProducts = [
  {
    name: 'Grand Theft Auto V',
    description: 'Open world action-adventure game',
    price: 29.99,
    category: 'PC Games',
    stock: 50,
    gameKey: 'GTAV-XXXX-XXXX-XXXX'
  },
  {
    name: 'Cyberpunk 2077',
    description: 'Futuristic RPG game',
    price: 39.99,
    category: 'PC Games',
    stock: 25,
    gameKey: 'CP77-XXXX-XXXX-XXXX'
  },
  {
    name: 'Steam Level 10 Account',
    description: 'Steam account with level 10',
    price: 15.99,
    category: 'Steam Accounts',
    stock: 10,
    gameKey: 'STEAM-ACC-001'
  },
  {
    name: 'Steam Wallet $50',
    description: '$50 Steam wallet code',
    price: 45.99,
    category: 'Gift Cards',
    stock: 100,
    gameKey: 'STEAM-50-XXXX'
  }
];

const testUsers = [
  {
    telegramId: 123456789,
    username: 'testuser1',
    firstName: 'Test',
    lastName: 'User'
  },
  {
    telegramId: 987654321,
    username: 'gamer2024',
    firstName: 'Gaming',
    lastName: 'Pro'
  }
];

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    // Clear existing data (optional)
    console.log('📝 Clearing existing test data...');
    
    // Create categories
    console.log('📂 Creating categories...');
    const categoryIds = {};
    
    for (const category of testCategories) {
      try {
        const response = await axios.post(`${API_BASE_URL}/categories`, category);
        categoryIds[category.name] = response.data._id;
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.log(`⚠️  Category ${category.name} might already exist`);
      }
    }

    // Get all categories to map names to IDs
    const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
    categoriesResponse.data.forEach(cat => {
      categoryIds[cat.name] = cat._id;
    });

    // Create products
    console.log('🎮 Creating products...');
    for (const product of testProducts) {
      try {
        const productData = {
          ...product,
          categoryId: categoryIds[product.category]
        };
        delete productData.category;
        
        const response = await axios.post(`${API_BASE_URL}/products`, productData);
        console.log(`✅ Created product: ${product.name} - $${product.price}`);
      } catch (error) {
        console.log(`⚠️  Product ${product.name} might already exist`);
      }
    }

    // Create test users
    console.log('👥 Creating test users...');
    for (const user of testUsers) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users`, user);
        console.log(`✅ Created user: ${user.username} (${user.telegramId})`);
      } catch (error) {
        console.log(`⚠️  User ${user.username} might already exist`);
      }
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${testCategories.length}`);
    console.log(`- Products: ${testProducts.length}`);
    console.log(`- Users: ${testUsers.length}`);
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };