import { randomUUID } from "crypto";
import { jsonDb } from "@/lib/json-db";

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
      price: {
        type: "fixed",
        amount: input.priceUsdc,
        currency: "USDC",
      },
      tax_category: "saas",
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

  const user = await jsonDb.findOrCreateUser(normalizedWalletAddress);

  return {
    id: user.id,
    wallet_address: user.walletAddress,
    created_at: user.createdAt,
    updated_at: user.createdAt,
  };
}

export async function resolveCheckoutPlan(dodoProductId?: string): Promise<DbPlan> {
  const plans = await jsonDb.listPlans();
  const matchedPlan = dodoProductId
    ? plans.find((plan) => plan.dodoProductId === dodoProductId)
    : plans.find((plan) => plan.active);

  const plan = matchedPlan ?? (await jsonDb.createPlan({
    name: "Starter Pro",
    priceUsdc: 49,
    billingInterval: "monthly",
    description: "Auto-generated default plan for StreamPay checkout.",
    dodoProductId: dodoProductId ?? null,
  }));

  return {
    id: plan.id,
    name: plan.name,
    price_usdc: String(plan.priceUsdc),
    billing_interval: plan.billingInterval,
    dodo_product_id: plan.dodoProductId,
  };
}

export async function createPendingSubscription(userId: string, plan: DbPlan): Promise<{ id: string }> {
  const subscription = await jsonDb.createSubscription({
    userId,
    planId: plan.id,
    status: "pending",
  });

  return { id: subscription.id };
}

export async function createCheckoutSessionRecord(input: CreateCheckoutSessionRecordInput): Promise<void> {
  await jsonDb.createCheckoutSession({
    userId: input.userId,
    planId: input.planId,
    subscriptionId: input.subscriptionId ?? null,
    checkoutSessionId: input.checkoutSessionId,
  });
}

export async function updateCheckoutSessionRecordStatus(input: {
  checkoutSessionId?: string | null;
  subscriptionId?: string | null;
  status: "pending" | "completed" | "failed" | "expired";
}): Promise<void> {
  if (input.checkoutSessionId) {
    await jsonDb.updateCheckoutSessionStatus(input.checkoutSessionId, input.status);
    return;
  }

  if (input.subscriptionId) {
    const session = await jsonDb.findCheckoutSessionBySubscriptionId(input.subscriptionId);
    if (session) {
      await jsonDb.updateCheckoutSessionStatus(session.checkoutSessionId, input.status);
    }
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
  await jsonDb.recordSubscriptionEvent({
    subscriptionId: input.subscriptionId ?? input.userId,
    eventType: input.eventType,
    amountUsdc: input.amountUsdc ?? null,
    metadata: {
      userId: input.userId,
      providerEventId: input.providerEventId ?? null,
      ...(input.payload ?? {}),
    },
  });
}

export async function updateSubscriptionStatus(input: {
  subscriptionId: string;
  status: "active" | "pending" | "canceled";
}): Promise<void> {
  await jsonDb.updateSubscriptionStatus(input.subscriptionId, input.status);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const state = await jsonDb.getState();
  const now = new Date();

  return {
    activePlans: state.plans.filter((plan) => plan.active).length,
    totalSubscribers: new Set(state.subscriptions.filter((subscription) => subscription.status === "active").map((subscription) => subscription.userId)).size,
    monthlyRevenueUsdc: state.subscriptionEvents
      .filter((event) => event.eventType === "payment_success")
      .filter((event) => {
        const createdAt = new Date(event.createdAt);
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      })
      .reduce((total, event) => total + (event.amountUsdc ?? 0), 0),
  };
}

export async function getDashboardRecentEvents(limit = 6): Promise<DashboardEvent[]> {
  const state = await jsonDb.getState();
  const usersById = new Map(state.users.map((user) => [user.id, user.walletAddress]));

  return state.subscriptionEvents
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      eventType: event.eventType,
      occurredAt: event.createdAt,
      walletAddress: (() => {
        const userId = event.metadata && typeof event.metadata.userId === "string" ? event.metadata.userId : null;
        return userId ? usersById.get(userId) ?? null : null;
      })(),
      amountUsdc: event.amountUsdc,
    }));
}

export async function getDashboardSubscriptionSnapshots(
  limit = 6
): Promise<DashboardSubscriptionSnapshot[]> {
  const state = await jsonDb.getState();
  const usersById = new Map(state.users.map((user) => [user.id, user.walletAddress]));

  return state.subscriptions
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit)
    .map((subscription) => ({
      subscriptionId: subscription.id,
      walletAddress: usersById.get(subscription.userId) ?? "Unknown wallet",
      status: subscription.status,
      paymentCount: state.subscriptionEvents.filter((event) => event.subscriptionId === subscription.id && event.eventType === "payment_success").length,
      lastUpdatedAt: subscription.updatedAt,
    }));
}

export async function listPlans(): Promise<PlanRecord[]> {
  const plans = await jsonDb.listPlans();
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    priceUsdc: plan.priceUsdc,
    billingInterval: plan.billingInterval,
    description: plan.description,
    dodoProductId: plan.dodoProductId,
    active: plan.active,
    createdAt: plan.createdAt,
  }));
}

export async function createPlanWithDodo(input: CreatePlanInput): Promise<PlanRecord> {
  const createdPlan = await jsonDb.createPlan({
    name: input.name,
    priceUsdc: input.priceUsdc,
    billingInterval: input.billingInterval,
    description: input.description ?? null,
    dodoProductId: null,
  });

  return {
    id: createdPlan.id,
    name: createdPlan.name,
    priceUsdc: createdPlan.priceUsdc,
    billingInterval: createdPlan.billingInterval,
    description: createdPlan.description,
    dodoProductId: createdPlan.dodoProductId,
    active: createdPlan.active,
    createdAt: createdPlan.createdAt,
  };
}

export async function findLatestSubscriptionIdForUser(userId: string): Promise<string | null> {
  const subscription = await jsonDb.findLatestSubscriptionForUser(userId);
  return subscription?.id ?? null;
}

export async function findUserIdBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const subscription = await jsonDb.findSubscriptionById(subscriptionId);
  return subscription?.userId ?? null;
}
