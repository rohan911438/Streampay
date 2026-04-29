const fetch = require('node-fetch');

async function testPaymentCreate() {
  const API_KEY = 'sp_live_demo_6b4a2d8e1c';
  const ENDPOINT = 'http://localhost:3000/api/payment/create';

  console.log('Testing /api/payment/create...');
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        customer_wallet: 'GfK6fP7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3B',
        amount: 10,
        plan_id: 'pdt_0NdVskVR8nZu7Rw1wqF1D'
      })
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPaymentCreate();
