const crypto = require('crypto');
const http = require('http');

async function run() {
  // 1. Seed deterministic records (skip for now since DB is down, but we will mock the subId)
  // Since we can't connect to DB, let's assume subId from query or just use a dummy one for the webhook.
  // Actually the query asked to seed if missing. Since I can't, I'll try to reach the endpoint anyway.
  
  const subId = 'sub_test_123';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = JSON.stringify({
    type: 'payment.succeeded',
    data: {
      id: 'pay_test_123',
      amount: 1000,
      currency: 'USDC',
      customer: { email: 'test@example.com' },
      metadata: {
        wallet: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
        wallet_address: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
        internal_subscription_id: subId
      },
      subscription: { id: subId },
      created_at: new Date().toISOString()
    }
  });

  const secret = process.env.DODO_WEBHOOK_SECRET;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (secret) {
    const signature = crypto.createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');
    headers['x-dodo-timestamp'] = timestamp;
    headers['x-dodo-signature'] = signature;
  }

  const req = http.request('http://localhost:3000/api/webhooks/dodo', {
    method: 'POST',
    headers: headers
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Body:', data);
    });
  });

  req.on('error', (e) => console.error(e));
  req.write(payload);
  req.end();
}

run();
