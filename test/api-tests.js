/**
 * Comprehensive API Test Suite
 * Tests all API endpoints with realistic scenarios
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

class APITester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async test(testName, testFunction) {
    try {
      this.log(`🧪 Testing: ${testName}`);
      await testFunction();
      this.testResults.passed++;
      this.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      let errorMsg = error.message;
      
      // If it's an axios error, get more details
      if (error.response) {
        errorMsg += ` (Status: ${error.response.status})`;
        if (error.response.data) {
          errorMsg += ` - ${JSON.stringify(error.response.data)}`;
        }
      }
      
      this.testResults.errors.push({ test: testName, error: errorMsg });
      this.log(`❌ FAILED: ${testName} - ${errorMsg}`);
    }
  }

  // User API Tests
  async testUserAPI() {
    this.log('\n👥 Testing User API...');

    // Test creating user
    await this.test('Create new user', async () => {
      const userData = {
        telegramId: Date.now(), // Use timestamp for unique IDs
        username: `apitest_user_${Date.now()}`,
        firstName: 'API',
        lastName: 'Test'
      };
      
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      if (!response.data.data || !response.data.data._id) throw new Error('No user ID returned');
      this.testUserId = response.data.data._id;
      this.testUserTelegramId = userData.telegramId;
    });

    // Test getting user by Telegram ID
    await this.test('Get user by Telegram ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/telegram/${this.testUserTelegramId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.data.username.includes('apitest_user')) throw new Error('Wrong user data');
    });

    // Test updating user
    await this.test('Update user', async () => {
      const updateData = { firstName: 'Updated' };
      const response = await axios.put(`${API_BASE_URL}/users/${this.testUserId}`, updateData);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.data.firstName !== 'Updated') throw new Error('User not updated');
    });
  }

  // Category API Tests
  async testCategoryAPI() {
    this.log('\n📂 Testing Category API...');

    // Test creating category
    await this.test('Create category', async () => {
      const categoryData = {
        name: `API Test Category ${Date.now()}`,
        description: 'Category created by API test'
      };
      
      const response = await axios.post(`${API_BASE_URL}/categories`, categoryData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      this.testCategoryId = response.data.data._id;
    });

    // Test getting all categories
    await this.test('Get all categories', async () => {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // API returns wrapped response: { success: true, data: [...] }
      if (!response.data.data || !Array.isArray(response.data.data)) throw new Error('Response data is not an array');
    });

    // Test getting category by ID
    await this.test('Get category by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/categories/${this.testCategoryId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.data.name.includes('API Test Category')) throw new Error('Wrong category data');
    });
  }

  // Product API Tests
  async testProductAPI() {
    this.log('\n🎮 Testing Product API...');

    // Test creating product
    await this.test('Create product', async () => {
      const productData = {
        name: `API Test Game ${Date.now()}`,
        description: 'Game created by API test',
        price: 19.99,
        categoryId: this.testCategoryId,
        digitalContent: ['GAME-KEY-001', 'GAME-KEY-002', 'GAME-KEY-003'],
        isAvailable: true,
        allowPreorder: false
      };
      
      const response = await axios.post(`${API_BASE_URL}/products`, productData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      this.testProductId = response.data.data._id;
    });

    // Test getting all products
    await this.test('Get all products', async () => {
      const response = await axios.get(`${API_BASE_URL}/products`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // API returns wrapped response: { success: true, data: [...] }
      if (!response.data.data || !Array.isArray(response.data.data)) throw new Error('Response data is not an array');
    });

    // Test getting products by category
    await this.test('Get products by category', async () => {
      const response = await axios.get(`${API_BASE_URL}/products?categoryId=${this.testCategoryId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // API returns wrapped response: { success: true, data: [...] }
      if (!response.data.data || !Array.isArray(response.data.data)) throw new Error('Response data is not an array');
    });

    // Test updating product availability
    await this.test('Update product availability', async () => {
      const response = await axios.put(`${API_BASE_URL}/products/${this.testProductId}`, { isAvailable: false });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.isAvailable !== false) throw new Error('Availability not updated');
    });
  }

  // Order API Tests
  async testOrderAPI() {
    this.log('\n📦 Testing Order API...');

    // Test creating order
    await this.test('Create order', async () => {
      const orderData = {
        userId: this.testUserId,
        productId: this.testProductId,
        quantity: 1
      };
      
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      this.testOrderId = response.data._id;
    });

    // Test getting user orders
    await this.test('Get user orders', async () => {
      const response = await axios.get(`${API_BASE_URL}/orders/user/${this.testUserId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // Order API returns: { orders: [...], total: X }
      if (!response.data.orders || !Array.isArray(response.data.orders)) throw new Error('Response orders is not an array');
    });

    // Test updating order status
    await this.test('Update order status', async () => {
      const response = await axios.put(`${API_BASE_URL}/orders/${this.testOrderId}/status`, { status: 'completed' });
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (response.data.status !== 'completed') throw new Error('Status not updated');
    });
  }

  // Payment API Tests
  async testPaymentAPI() {
    this.log('\n💳 Testing Payment API...');

    // Only GET payments endpoint exists - no creation endpoint
    await this.test('Get all payments', async () => {
      const response = await axios.get(`${API_BASE_URL}/payments`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // Payment API returns: { transactions: [...], total: X }
      if (!response.data.transactions || !Array.isArray(response.data.transactions)) throw new Error('Response transactions is not an array');
    });
  }

  // Notification API Tests
  async testNotificationAPI() {
    this.log('\n🔔 Testing Notification API...');

    // Test creating notification (admin broadcast style)
    await this.test('Create notification', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        audience: 'all_users'
      };
      
      const response = await axios.post(`${API_BASE_URL}/notifications`, notificationData);
      if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
      // Get the notification ID from the response (check what the actual response format is)
      this.testNotificationId = response.data._id || response.data.data?._id || response.data.id;
    });

    // Test getting all notifications (filter by userId)
    await this.test('Get notifications', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications?userId=${this.testUserId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      // Notifications API returns direct array: [...]
      if (!Array.isArray(response.data)) throw new Error('Response data is not an array');
    });

    // Test getting notification by ID
    await this.test('Get notification by ID', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications/${this.testNotificationId}`);
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
      if (!response.data.title) throw new Error('Notification data missing');
    });
  }

  // Error handling tests
  async testErrorHandling() {
    this.log('\n⚠️ Testing Error Handling...');

    await this.test('Handle invalid user ID format', async () => {
      try {
        await axios.get(`${API_BASE_URL}/users/nonexistent123`);
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Expected behavior - API correctly validates ObjectId format
        } else {
          throw error;
        }
      }
    });

    await this.test('Handle non-existent user with valid ID', async () => {
      try {
        await axios.get(`${API_BASE_URL}/users/507f1f77bcf86cd799439999`);
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Expected behavior - valid ID format but user doesn't exist
        } else {
          throw error;
        }
      }
    });

    await this.test('Handle invalid product creation', async () => {
      try {
        await axios.post(`${API_BASE_URL}/products`, { name: '' }); // Invalid data
        throw new Error('Should have thrown an error');
      } catch (error) {
        if (error.response && error.response.status >= 400) {
          // Expected behavior
        } else {
          throw error;
        }
      }
    });
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive API tests...\n');
    
    await this.testUserAPI();
    await this.testCategoryAPI();
    await this.testProductAPI();
    await this.testOrderAPI();
    await this.testPaymentAPI();
    await this.testNotificationAPI();
    await this.testErrorHandling();

    this.printSummary();
  }

  printSummary() {
    this.log('\n📊 TEST SUMMARY');
    this.log('================');
    this.log(`✅ Passed: ${this.testResults.passed}`);
    this.log(`❌ Failed: ${this.testResults.failed}`);
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    if (this.testResults.errors.length > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    this.log('\n🎉 API testing completed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().catch(console.error);
}

module.exports = { APITester };