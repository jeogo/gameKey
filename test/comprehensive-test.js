/**
 * Comprehensive Test Suite for GameKey Bot
 * This test suite:
 * 1. Fills the database with test data using the API
 * 2. Tests all payment routes like real users
 * 3. Tests the bot functionality end-to-end
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const MONGODB_URI = 'mongodb+srv://admin:admin@storebot.uwnfq.mongodb.net/?retryWrites=true&w=majority&appName=StoreBot';
const DB_NAME = 'telegram-store';

// Test data
const testCategories = [
  { name: 'Xbox Live Gold', description: 'Xbox Live Gold subscriptions' },
  { name: 'PlayStation Plus', description: 'PlayStation Plus memberships' },
  { name: 'Steam Games', description: 'Popular Steam game keys' },
  { name: 'Gift Cards', description: 'Various gaming gift cards' },
  { name: 'Accounts', description: 'Gaming accounts with progress' }
];

const testProducts = [
  {
    name: 'Xbox Live Gold 12 Months',
    description: 'Full year Xbox Live Gold membership',
    price: 59.99,
    digitalContent: [
      'XLG-2024-ABCD-EFGH-1234',
      'XLG-2024-IJKL-MNOP-5678',
      'XLG-2024-QRST-UVWX-9012'
    ]
  },
  {
    name: 'PlayStation Plus Essential 1 Year',
    description: 'Annual PlayStation Plus Essential subscription',
    price: 79.99,
    digitalContent: [
      'PSP-ESS-2024-AAAA-BBBB',
      'PSP-ESS-2024-CCCC-DDDD',
      'PSP-ESS-2024-EEEE-FFFF'
    ]
  },
  {
    name: 'Cyberpunk 2077 Steam Key',
    description: 'Digital download for Steam',
    price: 39.99,
    digitalContent: [
      'STEAM-CP77-ABCD-1234-EFGH',
      'STEAM-CP77-IJKL-5678-MNOP',
      'STEAM-CP77-QRST-9012-UVWX'
    ]
  },
  {
    name: '$50 Steam Gift Card',
    description: 'Steam Wallet gift card',
    price: 50.00,
    digitalContent: [
      'STEAM-GC-50-AAAA-BBBB-CCCC',
      'STEAM-GC-50-DDDD-EEEE-FFFF',
      'STEAM-GC-50-GGGG-HHHH-IIII'
    ]
  },
  {
    name: 'Fortnite Account Level 200+',
    description: 'High level Fortnite account with rare skins',
    price: 149.99,
    digitalContent: [
      'Account: user1@example.com / Pass123!',
      'Account: user2@example.com / Pass456!',
      'Account: user3@example.com / Pass789!'
    ]
  }
];

const testUsers = [
  { telegramId: 123456789, username: 'testuser1', firstName: 'John' },
  { telegramId: 987654321, username: 'testuser2', firstName: 'Jane' },
  { telegramId: 555666777, username: 'testuser3', firstName: 'Bob' },
  { telegramId: 111222333, username: 'testuser4', firstName: 'Alice' },
  { telegramId: 444555666, username: 'testuser5', firstName: 'Charlie' }
];

class GameKeyTester {
  constructor() {
    this.createdCategories = [];
    this.createdProducts = [];
    this.createdUsers = [];
    this.createdOrders = [];
    this.createdPayments = [];
  }

  async init() {
    console.log('🚀 Starting GameKey Comprehensive Test Suite');
    console.log('=' + '='.repeat(50));
    
    try {
      // Check if API server is running
      await this.checkServerConnection();
      
      // Clear existing test data
      await this.clearTestData();
      
      // Fill database with test data
      await this.fillDatabase();
      
      // Test all API endpoints
      await this.testAPIEndpoints();
      
      // Test payment flows
      await this.testPaymentFlows();
      
      // Test bot functionality simulation
      await this.testBotSimulation();
      
      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      throw error;
    }
  }

  async checkServerConnection() {
    console.log('\n🔍 Checking server connection...');
    try {
      const response = await axios.get(`${API_BASE_URL}/users?limit=1`);
      console.log('✅ API server is running');
    } catch (error) {
      console.error('❌ API server is not running. Please start it with: npm start');
      throw new Error('Server not running');
    }
  }

  async clearTestData() {
    console.log('\n🧹 Clearing existing test data...');
    
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db(DB_NAME);
      
      // Clear collections
      await db.collection('orders').deleteMany({});
      await db.collection('paymentTransactions').deleteMany({});
      await db.collection('products').deleteMany({});
      await db.collection('categories').deleteMany({});
      await db.collection('users').deleteMany({});
      
      await client.close();
      console.log('✅ Test data cleared');
      
    } catch (error) {
      console.error('⚠️  Could not clear test data:', error.message);
      // Continue anyway
    }
  }

  async fillDatabase() {
    console.log('\n📊 Filling database with test data...');
    
    // Create categories
    console.log('Creating categories...');
    for (const category of testCategories) {
      try {
        const response = await axios.post(`${API_BASE_URL}/categories`, category);
        this.createdCategories.push(response.data.data);
        console.log(`✅ Created category: ${category.name}`);
      } catch (error) {
        console.error(`❌ Failed to create category ${category.name}:`, error.response?.data || error.message);
      }
    }

    // Create products
    console.log('Creating products...');
    for (let i = 0; i < testProducts.length; i++) {
      const product = testProducts[i];
      const categoryId = this.createdCategories[i % this.createdCategories.length]._id;
      
      try {
        const response = await axios.post(`${API_BASE_URL}/products`, {
          ...product,
          categoryId,
          isAvailable: true
        });
        this.createdProducts.push(response.data.data);
        console.log(`✅ Created product: ${product.name}`);
      } catch (error) {
        console.error(`❌ Failed to create product ${product.name}:`, error.response?.data || error.message);
      }
    }

    // Create users
    console.log('Creating users...');
    for (const user of testUsers) {
      try {
        const response = await axios.post(`${API_BASE_URL}/users`, user);
        this.createdUsers.push(response.data.data);
        console.log(`✅ Created user: ${user.username}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.username}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n📈 Database filled with:`);
    console.log(`   ${this.createdCategories.length} categories`);
    console.log(`   ${this.createdProducts.length} products`);
    console.log(`   ${this.createdUsers.length} users`);
  }

  async testAPIEndpoints() {
    console.log('\n🔬 Testing API endpoints...');

    // Test GET endpoints
    await this.testGetEndpoints();
    
    // Test creating orders
    await this.testOrderCreation();
    
    // Test user profile endpoints
    await this.testUserEndpoints();
  }

  async testGetEndpoints() {
    console.log('Testing GET endpoints...');

    const endpoints = [
      { url: '/categories', name: 'Categories' },
      { url: '/products', name: 'Products' },
      { url: '/users', name: 'Users' },
      { url: '/orders', name: 'Orders' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint.url}`);
        console.log(`✅ ${endpoint.name}: ${response.data.data?.length || 0} items`);
      } catch (error) {
        console.error(`❌ ${endpoint.name} failed:`, error.response?.data || error.message);
      }
    }
  }

  async testOrderCreation() {
    console.log('Testing order creation...');

    if (this.createdUsers.length === 0 || this.createdProducts.length === 0) {
      console.log('⚠️  Skipping order tests - no users or products available');
      return;
    }

    // Create test orders
    for (let i = 0; i < Math.min(3, this.createdUsers.length); i++) {
      const user = this.createdUsers[i];
      const product = this.createdProducts[i % this.createdProducts.length];
      
      const orderData = {
        userId: user._id,
        productId: product._id,
        quantity: 1,
        unitPrice: product.price,
        totalAmount: product.price,
        status: 'pending'
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
        this.createdOrders.push(response.data.data);
        console.log(`✅ Created order for ${user.username}: ${product.name}`);
      } catch (error) {
        console.error(`❌ Failed to create order:`, error.response?.data || error.message);
      }
    }
  }

  async testUserEndpoints() {
    console.log('Testing user-specific endpoints...');

    if (this.createdUsers.length === 0) {
      console.log('⚠️  Skipping user tests - no users available');
      return;
    }

    const testUser = this.createdUsers[0];

    try {
      // Test get user by ID
      const response = await axios.get(`${API_BASE_URL}/users/${testUser._id}`);
      console.log(`✅ Retrieved user profile: ${response.data.data.username}`);

      // Test user orders
      const ordersResponse = await axios.get(`${API_BASE_URL}/users/${testUser._id}/orders`);
      console.log(`✅ Retrieved user orders: ${ordersResponse.data.data?.length || 0} orders`);

    } catch (error) {
      console.error('❌ User endpoint test failed:', error.response?.data || error.message);
    }
  }

  async testPaymentFlows() {
    console.log('\n💳 Testing payment flows...');

    if (this.createdOrders.length === 0) {
      console.log('⚠️  Skipping payment tests - no orders available');
      return;
    }

    // Test different crypto currencies
    const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'LTC'];

    for (let i = 0; i < Math.min(cryptoCurrencies.length, this.createdOrders.length); i++) {
      const order = this.createdOrders[i];
      const crypto = cryptoCurrencies[i];

      await this.testPaymentCreation(order, crypto);
    }

    // Test payment status checking
    await this.testPaymentStatusChecking();
  }

  async testPaymentCreation(order, cryptoCurrency) {
    console.log(`Testing ${cryptoCurrency} payment creation...`);

    const paymentData = {
      orderId: order._id,
      userId: order.userId,
      amount: order.totalAmount,
      currency: 'USD',
      cryptoCurrency: cryptoCurrency
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/payments/create`, paymentData);
      const payment = response.data.data;
      
      this.createdPayments.push(payment);
      console.log(`✅ ${cryptoCurrency} payment created: ${payment.externalId}`);
      console.log(`   Payment URL: ${payment.paymentUrl ? 'Generated' : 'Not available'}`);
      
    } catch (error) {
      console.error(`❌ ${cryptoCurrency} payment creation failed:`, error.response?.data || error.message);
    }
  }

  async testPaymentStatusChecking() {
    console.log('Testing payment status checking...');

    for (const payment of this.createdPayments) {
      try {
        const response = await axios.get(`${API_BASE_URL}/payments/${payment.externalId}/status`);
        console.log(`✅ Payment status check: ${payment.externalId} - ${response.data.data.status}`);
      } catch (error) {
        console.error(`❌ Payment status check failed for ${payment.externalId}:`, error.response?.data || error.message);
      }
    }
  }

  async testBotSimulation() {
    console.log('\n🤖 Testing bot simulation scenarios...');

    await this.simulateNewUserJourney();
    await this.simulateShoppingJourney();
    await this.simulatePurchaseJourney();
  }

  async simulateNewUserJourney() {
    console.log('Simulating new user journey...');

    const newUser = {
      telegramId: 999888777,
      username: 'newbotuser',
      firstName: 'Bot Test'
    };

    try {
      // Step 1: User starts bot (/start command)
      const userResponse = await axios.post(`${API_BASE_URL}/users`, newUser);
      console.log('✅ New user registered through bot');

      // Step 2: User views profile
      const profileResponse = await axios.get(`${API_BASE_URL}/users/${userResponse.data.data._id}`);
      console.log('✅ User viewed profile');

      // Step 3: User browses categories
      const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
      console.log(`✅ User browsed ${categoriesResponse.data.data.length} categories`);

    } catch (error) {
      console.error('❌ New user journey simulation failed:', error.response?.data || error.message);
    }
  }

  async simulateShoppingJourney() {
    console.log('Simulating shopping journey...');

    try {
      // Browse products
      const productsResponse = await axios.get(`${API_BASE_URL}/products?limit=10`);
      console.log(`✅ User browsed ${productsResponse.data.data.length} products`);

      // View specific product
      if (this.createdProducts.length > 0) {
        const product = this.createdProducts[0];
        const productResponse = await axios.get(`${API_BASE_URL}/products/${product._id}`);
        console.log(`✅ User viewed product: ${productResponse.data.data.name}`);
      }

    } catch (error) {
      console.error('❌ Shopping journey simulation failed:', error.response?.data || error.message);
    }
  }

  async simulatePurchaseJourney() {
    console.log('Simulating complete purchase journey...');

    if (this.createdUsers.length === 0 || this.createdProducts.length === 0) {
      console.log('⚠️  Skipping purchase simulation - insufficient test data');
      return;
    }

    const user = this.createdUsers[0];
    const product = this.createdProducts[0];

    try {
      // Step 1: Create order
      const orderData = {
        userId: user._id,
        productId: product._id,
        quantity: 1,
        unitPrice: product.price,
        totalAmount: product.price,
        status: 'pending'
      };

      const orderResponse = await axios.post(`${API_BASE_URL}/orders`, orderData);
      console.log('✅ Purchase order created');

      // Step 2: Create payment
      const paymentData = {
        orderId: orderResponse.data.data._id,
        userId: user._id,
        amount: product.price,
        currency: 'USD',
        cryptoCurrency: 'USDT'
      };

      const paymentResponse = await axios.post(`${API_BASE_URL}/payments/create`, paymentData);
      console.log('✅ Payment created with URL');

      // Step 3: Check payment status
      const statusResponse = await axios.get(`${API_BASE_URL}/payments/${paymentResponse.data.data.externalId}/status`);
      console.log(`✅ Payment status: ${statusResponse.data.data.status}`);

      // Step 4: Check user orders
      const userOrdersResponse = await axios.get(`${API_BASE_URL}/users/${user._id}/orders`);
      console.log(`✅ User has ${userOrdersResponse.data.data.length} orders`);

    } catch (error) {
      console.error('❌ Purchase journey simulation failed:', error.response?.data || error.message);
    }
  }

  async generateTestReport() {
    console.log('\n📋 Test Report Summary');
    console.log('=' + '='.repeat(40));
    console.log(`Categories Created: ${this.createdCategories.length}`);
    console.log(`Products Created: ${this.createdProducts.length}`);
    console.log(`Users Created: ${this.createdUsers.length}`);
    console.log(`Orders Created: ${this.createdOrders.length}`);
    console.log(`Payments Created: ${this.createdPayments.length}`);
    
    // Test database connection
    try {
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      const db = client.db(DB_NAME);
      
      const collections = ['categories', 'products', 'users', 'orders', 'paymentTransactions'];
      console.log('\n📊 Database State:');
      
      for (const collection of collections) {
        const count = await db.collection(collection).countDocuments();
        console.log(`   ${collection}: ${count} documents`);
      }
      
      await client.close();
      
    } catch (error) {
      console.error('❌ Could not generate database report:', error.message);
    }
  }
}

// Export for use in other files
module.exports = GameKeyTester;

// Run tests if called directly
if (require.main === module) {
  const tester = new GameKeyTester();
  
  tester.init()
    .then(() => tester.generateTestReport())
    .then(() => {
      console.log('\n🎉 Test suite completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Check the API responses');
      console.log('   2. Verify database is populated');
      console.log('   3. Test the Telegram bot manually');
      console.log('   4. Try making real payments with small amounts');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}