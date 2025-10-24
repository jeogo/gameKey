const axios = require('axios');

(async () => {
  try {
    const API_BASE = 'http://localhost:3000/api';
    console.log('1. Creating category...');
    const createRes = await axios.post(`${API_BASE}/categories`, {
      name: 'Test Cat', 
      description: 'Test desc'
    });
    console.log('   Status:', createRes.status);
    console.log('   Success:', createRes.data.success);
    
    const id = createRes.data.data._id;
    console.log('   ID:', id);
    
    console.log('2. Getting category by ID...');
    const getRes = await axios.get(`${API_BASE}/categories/${id}`);
    console.log('   Status:', getRes.status);
    console.log('   Success:', getRes.data.success);
    console.log('   Name:', getRes.data.data.name);
    
    console.log('✅ Category API working correctly!');
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.response) {
      console.error('   Response status:', e.response.status);
      console.error('   Response data:', e.response.data);
    }
  }
})();