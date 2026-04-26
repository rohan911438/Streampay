import { db } from "@paystream/db";
import { randomUUID } from "crypto";

type DbUser = {
  id: string;
  wallet_address: string;
  created_at?: string;
  updated_at?: string;
};

type DbPlan = {
  id: string;
  name: string;
  price_usdc: string;
  billing_interval: "monthly" | "yearly";
  dodo_product_id?: string | null;
};

export type PlanRecord = {
  id: string;
  name: string;
  priceUsdc: number;
  billingInterval: "monthly" | "yearly";
  description: string | null;
  dodoProductId: string | null;
  active: boolean;
  createdAt: string;
};

export type CreatePlanInput = {
  name: string;
  priceUsdc: number;
  billingInterval: "monthly" | "yearly";
  description?: string | null;
};

export type CheckoutSessionRecord = {
  id: string;
  userId: string;
  planId: string;
  subscriptionId: string | null;
  checkoutSessionId: string;
  status: "pending" | "completed" | "failed" | "expired";
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type CreateCheckoutSessionRecordInput = {
  userId: string;
  planId: string;
  subscriptionId?: string | null;
  checkoutSessionId: string;
};

export type DashboardMetrics = {
  activePlans: number;
  totalSubscribers: number;
  monthlyRevenueUsdc: number;
};

export type DashboardEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  walletAddress: string | null;
  amountUsdc: number | null;
};

export type DashboardSubscriptionSnapshot = {
  subscriptionId: string;
  walletAddress: string;
  status: string;
  paymentCount: number;
  lastUpdatedAt: string;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

const DODO_API_BASE_URL = process.env.DODO_API_BASE_URL ?? "https://test.dodopayments.com";
const DODO_API_KEY = process.env.DODO_API_KEY;

function createFallbackUser(walletAddress: string): DbUser {
  const now = new Date().toISOString();

  return {
    id: `wallet:${walletAddress.trim()}`,
    wallet_address: walletAddress.trim(),
    created_at: now,
    updated_at: now,
  };
}

function createFallbackPlan(dodoProductId?: string): DbPlan {
  return {
    id: `plan:${dodoProductId ?? "starter-pro"}`,
    name: "Starter Pro",
    price_usdc: "49",
    billing_interval: "monthly",
    dodo_product_id: dodoProductId ?? null,
  };
}

function extractDodoProductId(payload: Record<string, unknown>): string | null {
  const candidates = [payload.product_id, payload.productId, payload.id, payload.data];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }

    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      const nestedData = nested.data && typeof nested.data === "object" ? (nested.data as Record<string, unknown>) : null;
      const nestedValue =
        nested.product_id ??
        nested.productId ??
        nested.id ??
        (nestedData?.product_id) ??
        (nestedData?.productId) ??
        (nestedData?.id);

      if (typeof nestedValue === "string" && nestedValue.trim().length > 0) {
        return nestedValue.trim();
      }
    }
  }

  return null;
}

async function createDodoPlanProduct(input: CreatePlanInput): Promise<string> {
  if (!DODO_API_KEY) {
    throw new Error("DODO_API_KEY is required to create Dodo products");
  }

  const response = await fetch(`${DODO_API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DODO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      description: input.description ?? undefined,
      billing_interval: input.billingInterval,
      interval: input.billingInterval,
      amount: input.priceUsdc,
      price: input.priceUsdc,
      currency: "USDC",
      billing_model: "subscription",
      metadata: {
        source: "streampay",
      },
    }),
    cache: "no-store",
  });

  let payload: Record<string, unknown> = {};

  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    if (!response.ok) {
      throw new Error("Dodo product creation returned an invalid response");
    }
  }

  if (!response.ok) {
    const message =
      (typeof payload.detail === "string" && payload.detail) ||
      (typeof payload.message === "string" && payload.message) ||
      "Dodo product creation failed";
    throw new Error(message);
  }

  const dodoProductId = extractDodoProductId(payload);

  if (!dodoProductId) {
    throw new Error("Dodo product creation response did not include a product identifier");
  }

  return dodoProductId;
}

export function isLikelySolanaWalletAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export async function findOrCreateUserByWallet(walletAddress: string): Promise<DbUser> {
  const normalizedWalletAddress = walletAddress.trim();

  if (!isDatabaseConfigured()) {
    return createFallbackUser(normalizedWalletAddress);
  }

  const result = await db.query<DbUser>(
    `INSERT INTO users (wallet_address)
     VALUES ($1)
     ON CONFLICT (wallet_address)
     DO UPDATE SET updated_at = NOW()
     RETURNING id, wallet_address, created_at::text AS created_at, updated_at::text AS updated_at`,
    [normalizedWalletAddress]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  throw new Error("Failed to create or load wallet user");
}

export async function resolveCheckoutPlan(dodoProductId?: string): Promise<DbPlan> {
  if (!isDatabaseConfigured()) {
    return createFallbackPlan(dodoProductId);
  }

  if (dodoProductId) {
    const planByProduct = await db.query<DbPlan>(
      `SELECT id, name, price_usdc::text AS price_usdc, billing_interval
       FROM plans
       WHERE dodo_product_id = $1
       LIMIT 1`,
      [dodoProductId]
    );

    if (planByProduct.rows[0]) {
      return planByProduct.rows[0];
    }
  }

  const activePlan = await db.query<DbPlan>(
    `SELECT id, name, price_usdc::text AS price_usdc, billing_interval
     FROM plans
     WHERE is_active = true
     ORDER BY created_at ASC
     LIMIT 1`
  );

  if (activePlan.rows[0]) {
    return activePlan.rows[0];
  }

  const defaultPlan = await db.insert<DbPlan>("plans", {
    name: "Starter Pro",
    price_usdc: 49,
    billing_interval: "monthly",
    description: "Auto-generated default plan for StreamPay checkout.",
    dodo_product_id: dodoProductId ?? null,
    is_active: true,
  });

  if (!defaultPlan) {
    throw new Error("Failed to resolve checkout plan");
  }

  return {
    ...defaultPlan,
    price_usdc: String(defaultPlan.price_usdc),
  };
}

export async function createPendingSubscription(userId: string, plan: DbPlan): Promise<{ id: string }> {
  if (!isDatabaseConfigured()) {
    return { id: `pending:${randomUUID()}` };
  }

  const nextBillingDateExpr = plan.billing_interval === "yearly" ? "NOW() + INTERVAL '1 year'" : "NOW() + INTERVAL '1 month'";

  const result = await db.query<{ id: string }>(
    `INSERT INTO subscriptions (user_id, plan_id, status, start_date, next_billing_date)
     VALUES ($1, $2, 'pending', NOW(), ${nextBillingDateExpr})
     RETURNING id`,
    [userId, plan.id]
  );

  if (!result.rows[0]) {
    throw new Error("Failed to create pending subscription");
  }

  return result.rows[0];
}

export async function createCheckoutSessionRecord(input: CreateCheckoutSessionRecordInput): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  await db.insert("checkout_sessions", {
    user_id: input.userId,
    plan_id: input.planId,
    subscription_id: input.subscriptionId ?? null,
    checkout_session_id: input.checkoutSessionId,
    status: "pending",
  });
}

export async function updateCheckoutSessionRecordStatus(input: {
  checkoutSessionId?: string | null;
  subscriptionId?: string | null;
  status: "pending" | "completed" | "failed" | "expired";
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (input.checkoutSessionId) {
    await db.query(
      `UPDATE checkout_sessions
       SET status = $2,
           updated_at = NOW(),
           completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
       WHERE checkout_session_id = $1`,
      [input.checkoutSessionId, input.status]
    );
    return;
  }

  if (input.subscriptionId) {
    await db.query(
      `UPDATE checkout_sessions
       SET status = $2,
           updated_at = NOW(),
           completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
       WHERE subscription_id = $1`,
      [input.subscriptionId, input.status]
    );
  }
}

export async function recordSubscriptionEvent(input: {
  userId: string;
  subscriptionId?: string | null;
  amountUsdc?: number | null;
  eventType:
    | "payment_success"
    | "payment_failed"
    | "webhook_received"
    | "webhook_processed"
    | "subscription_created"
    | "subscription_canceled";
  providerEventId?: string | null;
  payload?: Record<string, unknown>;
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  await db.insert("subscription_events", {
    user_id: input.userId,
    subscription_id: input.subscriptionId ?? null,
    amount_usdc: input.amountUsdc ?? null,
    event_type: input.eventType,
    provider_event_id: input.providerEventId ?? null,
    payload: input.payload ?? null,
    occurred_at: new Date().toISOString(),
  });
}

export async function updateSubscriptionStatus(input: {
  subscriptionId: string;
  status: "active" | "pending" | "canceled";
}): Promise<void> {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (input.status === "canceled") {
    await db.query(
      `UPDATE subscriptions
       SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [input.subscriptionId]
    );
    return;
  }

  await db.query(
    `UPDATE subscriptions
     SET status = $2, updated_at = NOW()
     WHERE id = $1`,
    [input.subscriptionId, input.status]
  );
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!isDatabaseConfigured()) {
    return {
      activePlans: 0,
      totalSubscribers: 0,
      monthlyRevenueUsdc: 0,
    };
  }

  const [activePlansResult, subscribersResult, monthlyRevenueResult] = await Promise.all([
    db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM plans WHERE is_active = true"),
    db.query<{ count: string }>("SELECT COUNT(DISTINCT user_id)::text AS count FROM subscriptions WHERE status = 'active'"),
    db.query<{ total: string | null }>(
      `SELECT COALESCE(SUM(amount_usdc), 0)::text AS total
       FROM subscription_events
       WHERE event_type = 'payment_success'
         AND occurred_at >= date_trunc('month', NOW())`
    ),
  ]);

  return {
    activePlans: Number(activePlansResult.rows[0]?.count ?? 0),
    totalSubscribers: Number(subscribersResult.rows[0]?.count ?? 0),
    monthlyRevenueUsdc: Number(monthlyRevenueResult.rows[0]?.total ?? 0),
  };
}

export async function getDashboardRecentEvents(limit = 6): Promise<DashboardEvent[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await db.query<{
    id: string;
    event_type: string;
    occurred_at: string;
    wallet_address: string | null;
    amount_usdc: string | null;
  }>(
    `SELECT e.id,
            e.event_type,
            e.occurred_at,
            u.wallet_address,
            e.amount_usdc::text AS amount_usdc
     FROM subscription_events e
     LEFT JOIN users u ON u.id = e.user_id
     ORDER BY e.occurred_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    walletAddress: row.wallet_address,
    amountUsdc: row.amount_usdc ? Number(row.amount_usdc) : null,
  }));
}

export async function getDashboardSubscriptionSnapshots(
  limit = 6
): Promise<DashboardSubscriptionSnapshot[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await db.query<{
    subscription_id: string;
    wallet_address: string;
    status: string;
    payment_count: string;
    last_updated_at: string;
  }>(
    `SELECT s.id AS subscription_id,
            u.wallet_address,
            s.status,
            COUNT(*) FILTER (WHERE e.event_type = 'payment_success')::text AS payment_count,
            COALESCE(MAX(e.occurred_at), s.updated_at)::text AS last_updated_at
     FROM subscriptions s
     INNER JOIN users u ON u.id = s.user_id
     LEFT JOIN subscription_events e ON e.subscription_id = s.id
     GROUP BY s.id, u.wallet_address, s.status, s.updated_at
     ORDER BY COALESCE(MAX(e.occurred_at), s.updated_at) DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    subscriptionId: row.subscription_id,
    walletAddress: row.wallet_address,
    status: row.status,
    paymentCount: Number(row.payment_count),
    lastUpdatedAt: row.last_updated_at,
  }));
}

export async function listPlans(): Promise<PlanRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  const result = await db.query<{
    id: string;
    name: string;
    price_usdc: string;
    billing_interval: "monthly" | "yearly";
    description: string | null;
    dodo_product_id: string | null;
    is_active: boolean;
    created_at: string;
  }>(
    `SELECT id,
            name,
            price_usdc::text AS price_usdc,
            billing_interval,
            description,
            dodo_product_id,
            is_active,
            created_at::text AS created_at
     FROM plans
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    priceUsdc: Number(row.price_usdc),
    billingInterval: row.billing_interval,
    description: row.description,
    dodoProductId: row.dodo_product_id,
    active: row.is_active,
    createdAt: row.created_at,
  }));
}

export async function createPlanWithDodo(input: CreatePlanInput): Promise<PlanRecord> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to create plans");
  }

  const dodoProductId = await createDodoPlanProduct(input);

  const createdPlan = await db.withTransaction(async (client) => {
    const result = await client.query<{
      id: string;
      name: string;
      price_usdc: string;
      billing_interval: "monthly" | "yearly";
      description: string | null;
      dodo_product_id: string | null;
      is_active: boolean;
      created_at: string;
    }>(
      `INSERT INTO plans (name, price_usdc, billing_interval, description, dodo_product_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id,
                 name,
                 price_usdc::text AS price_usdc,
                 billing_interval,
                 description,
                 dodo_product_id,
                 is_active,
                 created_at::text AS created_at`,
      [input.name, input.priceUsdc, input.billingInterval, input.description ?? null, dodoProductId]
    );

    if (!result.rows[0]) {
      throw new Error("Failed to save plan in database");
    }

    return result.rows[0];
  });

  return {
    id: createdPlan.id,
    name: createdPlan.name,
    priceUsdc: Number(createdPlan.price_usdc),
    billingInterval: createdPlan.billing_interval,
    description: createdPlan.description,
    dodoProductId: createdPlan.dodo_product_id,
    active: createdPlan.is_active,
    createdAt: createdPlan.created_at,
  };
}

export async function findLatestSubscriptionIdForUser(userId: string): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await db.query<{ id: string }>(
    `SELECT id
     FROM subscriptions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.id ?? null;
}

export async function findUserIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const result = await db.query<{ user_id: string }>(
    "SELECT user_id FROM subscriptions WHERE id = $1 LIMIT 1",
    [subscriptionId]
  );

  return result.rows[0]?.user_id ?? null;
}
