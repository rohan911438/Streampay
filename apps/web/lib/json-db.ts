import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const DB_DIR = join(process.cwd(), ".data");

interface DataStore {
  merchants: Merchant[];
  plans: Plan[];
  users: User[];
  subscriptions: Subscription[];
  payments: Payment[];
  checkoutSessions: CheckoutSession[];
  subscriptionEvents: SubscriptionEvent[];
}

export interface Merchant {
  id: string;
  name: string;
  api_key: string;
  wallet_address?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  merchantId: string;
  userId: string | null;
  subscriptionId: string | null;
  amountUsdc: number;
  status: "pending" | "success" | "failed" | "completed";
  provider: string;
  executionLayer?: string;
  type: "public" | "private";
  walletAddress: string | null;
  transactionReference: string | null;
  paidAt: string;
}

export interface Plan {
  id: string;
  name: string;
  priceUsdc: number;
  billingInterval: "monthly" | "yearly";
  description: string | null;
  dodoProductId: string | null;
  active: boolean;
  merchantId: string;
  createdAt: string;
}

export interface User {
  id: string;
  walletAddress: string;
  merchantId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  merchantId: string;
  status: "active" | "pending" | "canceled";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  billingDate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSession {
  id: string;
  userId: string;
  planId: string;
  merchantId: string;
  subscriptionId: string | null;
  checkoutSessionId: string;
  status: "pending" | "completed" | "failed" | "expired";
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  merchantId: string;
  eventType: string;
  provider?: "dodo" | "cloak" | string | null;
  executionLayer?: "magicblock" | string | null;
  amountUsdc: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

async function ensureDir() {
  try {
    await mkdir(DB_DIR, { recursive: true });
  } catch {}
}

async function readDb(): Promise<DataStore> {
  await ensureDir();
  const defaultState: DataStore = {
    merchants: [],
    plans: [],
    users: [],
    subscriptions: [],
    payments: [],
    checkoutSessions: [],
    subscriptionEvents: [],
  };

  try {
    const data = await readFile(join(DB_DIR, "db.json"), "utf-8");
    const parsed = JSON.parse(data);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

async function writeDb(data: DataStore) {
  await ensureDir();
  await writeFile(join(DB_DIR, "db.json"), JSON.stringify(data, null, 2), "utf-8");
}

export const jsonDb = {
  async getState(): Promise<DataStore> {
    return readDb();
  },

  async listMerchants(): Promise<Merchant[]> {
    const db = await readDb();
    return db.merchants;
  },

  async listPayments(): Promise<Payment[]> {
    const db = await readDb();
    return db.payments;
  },

  async findMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
    const db = await readDb();
    // Support the demo key if it doesn't exist in local DB
    if (apiKey === "sp_live_demo_6b4a2d8e1c") {
      let demo = db.merchants.find(m => m.api_key === apiKey);
      if (!demo) {
        demo = {
          id: "00000000-0000-0000-0000-000000000000",
          name: "Demo Merchant (Local)",
          api_key: "sp_live_demo_6b4a2d8e1c",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      return demo;
    }
    return db.merchants.find(m => m.api_key === apiKey) || null;
  },

  async findMerchantById(id: string): Promise<Merchant | null> {
    const db = await readDb();
    if (id === "00000000-0000-0000-0000-000000000000") {
      return {
        id,
        name: "Demo Merchant (Local)",
        api_key: "sp_live_demo_6b4a2d8e1c",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return db.merchants.find(m => m.id === id) || null;
  },

  async updateMerchant(id: string, updates: Partial<Merchant>): Promise<Merchant | null> {
    const db = await readDb();
    const index = db.merchants.findIndex(m => m.id === id);
    if (index === -1) {
      // If it's the demo merchant and not in DB, we "seed" it on the fly
      if (id === "00000000-0000-0000-0000-000000000000") {
        const demo: Merchant = {
          id,
          name: "Demo Merchant (Local)",
          api_key: "sp_live_demo_6b4a2d8e1c",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...updates
        };
        db.merchants.push(demo);
        await writeDb(db);
        return demo;
      }
      return null;
    }
    db.merchants[index] = { ...db.merchants[index], ...updates, updated_at: new Date().toISOString() };
    await writeDb(db);
    return db.merchants[index];
  },

  async createPayment(input: Omit<Payment, "id" | "paidAt">): Promise<Payment> {
    const db = await readDb();
    const payment: Payment = {
      ...input,
      id: randomUUID(),
      paidAt: new Date().toISOString()
    };
    db.payments.push(payment);
    await writeDb(db);
    return payment;
  },

  async listPlans(): Promise<Plan[]> {
    const db = await readDb();
    return db.plans;
  },

  async listUsers(): Promise<User[]> {
    const db = await readDb();
    return db.users;
  },

  async listSubscriptions(): Promise<Subscription[]> {
    const db = await readDb();
    return db.subscriptions;
  },

  async listSubscriptionEvents(): Promise<SubscriptionEvent[]> {
    const db = await readDb();
    return db.subscriptionEvents;
  },

  async listCheckoutSessions(): Promise<CheckoutSession[]> {
    const db = await readDb();
    return db.checkoutSessions;
  },

  async createPlan(input: {
    name: string;
    priceUsdc: number;
    billingInterval: "monthly" | "yearly";
    description?: string | null;
    dodoProductId?: string | null;
  }): Promise<Plan> {
    const db = await readDb();
    const plan: Plan = {
      id: randomUUID(),
      name: input.name,
      priceUsdc: input.priceUsdc,
      billingInterval: input.billingInterval,
      description: input.description || null,
      dodoProductId: input.dodoProductId || null,
      active: true,
      merchantId: "00000000-0000-0000-0000-000000000000",
      createdAt: new Date().toISOString(),
    };
    db.plans.push(plan);
    await writeDb(db);
    return plan;
  },

  async findOrCreateUser(walletAddress: string): Promise<User> {
    const db = await readDb();
    let user = db.users.find((u) => u.walletAddress === walletAddress);
    if (!user) {
      user = {
        id: randomUUID(),
        walletAddress,
        merchantId: "00000000-0000-0000-0000-000000000000",
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      await writeDb(db);
    }
    return user;
  },

  async findLatestSubscriptionForUser(userId: string): Promise<Subscription | null> {
    const db = await readDb();
    const subs = db.subscriptions.filter((s) => s.userId === userId);
    if (subs.length === 0) return null;
    return subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  },

  async findUserById(userId: string): Promise<User | null> {
    const db = await readDb();
    return db.users.find((user) => user.id === userId) ?? null;
  },

  async findSubscriptionById(subscriptionId: string): Promise<Subscription | null> {
    const db = await readDb();
    return db.subscriptions.find((subscription) => subscription.id === subscriptionId) ?? null;
  },

  async findCheckoutSessionBySubscriptionId(subscriptionId: string): Promise<CheckoutSession | null> {
    const db = await readDb();
    return db.checkoutSessions.find((session) => session.subscriptionId === subscriptionId) ?? null;
  },

  async createSubscription(input: {
    userId: string;
    planId: string;
    status: "active" | "pending" | "canceled";
  }): Promise<Subscription> {
    const db = await readDb();
    const subscription: Subscription = {
      id: randomUUID(),
      userId: input.userId,
      planId: input.planId,
      merchantId: "00000000-0000-0000-0000-000000000000",
      status: input.status,
      currentPeriodStart: input.status === "active" ? new Date().toISOString() : null,
      currentPeriodEnd: null,
      billingDate: new Date().getDate(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.subscriptions.push(subscription);
    await writeDb(db);
    return subscription;
  },

  async updateSubscriptionStatus(
    subscriptionId: string,
    status: "active" | "pending" | "canceled"
  ): Promise<Subscription | null> {
    const db = await readDb();
    const sub = db.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return null;
    sub.status = status;
    sub.updatedAt = new Date().toISOString();
    if (status === "active" && !sub.currentPeriodStart) {
      sub.currentPeriodStart = new Date().toISOString();
    }
    await writeDb(db);
    return sub;
  },

  async recordSubscriptionEvent(input: {
    subscriptionId: string;
    eventType: string;
    provider?: "dodo" | "cloak" | string | null;
    executionLayer?: "magicblock" | string | null;
    amountUsdc?: number | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<SubscriptionEvent> {
    const db = await readDb();
    const event: SubscriptionEvent = {
      id: randomUUID(),
      subscriptionId: input.subscriptionId,
      merchantId: "00000000-0000-0000-0000-000000000000",
      eventType: input.eventType,
      provider: input.provider || null,
      executionLayer: input.executionLayer || null,
      amountUsdc: input.amountUsdc || null,
      metadata: input.metadata || null,
      createdAt: new Date().toISOString(),
    };
    db.subscriptionEvents.push(event);
    await writeDb(db);
    return event;
  },

  async createCheckoutSession(input: {
    userId: string;
    planId: string;
    subscriptionId: string | null;
    checkoutSessionId?: string;
  }): Promise<CheckoutSession> {
    const db = await readDb();
    const session: CheckoutSession = {
      id: randomUUID(),
      userId: input.userId,
      planId: input.planId,
      subscriptionId: input.subscriptionId,
      merchantId: "00000000-0000-0000-0000-000000000000",
      checkoutSessionId: input.checkoutSessionId ?? randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
    db.checkoutSessions.push(session);
    await writeDb(db);
    return session;
  },

  async updateCheckoutSessionStatus(
    checkoutSessionId: string,
    status: "pending" | "completed" | "failed" | "expired"
  ): Promise<CheckoutSession | null> {
    const db = await readDb();
    const session = db.checkoutSessions.find((s) => s.checkoutSessionId === checkoutSessionId);
    if (!session) return null;
    session.status = status;
    session.updatedAt = new Date().toISOString();
    if (status === "completed") {
      session.completedAt = new Date().toISOString();
    }
    await writeDb(db);
    return session;
  },
};
