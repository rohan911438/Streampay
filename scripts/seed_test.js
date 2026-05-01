const { Client } = require('pg');
async function seed() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/streampay' });
  await client.connect();
  try {
    let res = await client.query("SELECT id FROM users WHERE wallet_address = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY'");
    let userId;
    if (res.rows.length === 0) {
      res = await client.query("INSERT INTO users (wallet_address, name, email, role) VALUES ('86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY', 'Test User', 'test@example.com', 'user') RETURNING id");
      userId = res.rows[0].id;
    } else {
      userId = res.rows[0].id;
    }

    res = await client.query("SELECT id FROM plans WHERE type = 'monthly' LIMIT 1");
    let planId;
    if (res.rows.length === 0) {
      res = await client.query("INSERT INTO plans (name, type, price, currency, duration_days) VALUES ('Monthly Plan', 'monthly', 10, 'USDC', 30) RETURNING id");
      planId = res.rows[0].id;
    } else {
      planId = res.rows[0].id;
    }

    res = await client.query("SELECT id FROM subscriptions WHERE user_id = $1 AND plan_id = $2 AND status = 'pending'", [userId, planId]);
    let subId;
    if (res.rows.length === 0) {
      res = await client.query("INSERT INTO subscriptions (user_id, plan_id, status, provider) VALUES ($1, $2, 'pending', 'dodo') RETURNING id", [userId, planId]);
      subId = res.rows[0].id;
    } else {
      subId = res.rows[0].id;
    }
    console.log(JSON.stringify({ userId, planId, subId }));
  } finally {
    await client.end();
  }
}
seed().catch(err => { console.error(err); process.exit(1); });
