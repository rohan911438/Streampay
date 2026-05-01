const { Client } = require('pg');
async function query() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/streampay' });
  try {
    await client.connect();
    const payments = await client.query("SELECT provider_payment_id, amount_usdc, user_id, plan_id, subscription_id, paid_at FROM payments ORDER BY paid_at DESC LIMIT 1");
    console.log('Payments:', payments.rows);
    const sub = await client.query("SELECT id, status, start_date, next_billing_date, updated_at FROM subscriptions ORDER BY updated_at DESC LIMIT 1");
    console.log('Subscription:', sub.rows);
    const events = await client.query("SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 1");
    console.log('Events:', events.rows);
  } catch(e) {
    console.log('DB Error:', e.message);
  } finally {
    await client.end();
  }
}
query();
