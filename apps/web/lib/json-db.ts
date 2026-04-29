import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const DB_DIR = join(process.cwd(), ".data");

interface DataStore {
  plans: Plan[];
  users: User[];
  subscriptions: Subscription[];
  checkoutSessions: CheckoutSession[];
  subscriptionEvents: SubscriptionEvent[];
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
  try {
    const data = await readFile(join(DB_DIR, "db.json"), "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      plans: [],
      users: [],
      subscriptions: [],
      checkoutSessions: [],
      subscriptionEvents: [],
    };
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
