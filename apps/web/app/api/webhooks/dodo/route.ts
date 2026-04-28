import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@paystream/db";
import { recordDodoWebhookEvent } from "@/lib/dodo-webhook-state";
import { isLikelySolanaWalletAddress, recordSubscriptionEvent } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET?.trim() || null;
const SIGNATURE_HEADERS = [
  "x-dodo-signature",
  "x-dodo-webhook-signature",
  "dodo-signature",
  "x-webhook-signature",
];
const TIMESTAMP_HEADERS = ["x-dodo-timestamp", "dodo-timestamp", "x-webhook-timestamp"];
const SUPPORTED_EVENTS = new Set(["payment.succeeded", "subscription.active", "subscription.renewed"]);

let schemaReady: Promise<void> | null = null;

type WebhookPayload = Record<string, unknown> & {
  id?: unknown;
  event_id?: unknown;
  message_id?: unknown;
  event_type?: unknown;
  type?: unknown;
  event?: unknown;
  metadata?: unknown;
  data?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  payment?: Record<string, unknown>;
};

type WebhookIdentifiers = {
  eventType: string;
  eventId: string | null;
  paymentId: string | null;
  subscriptionId: string | null;
  internalSubscriptionId: string | null;
  checkoutSessionId: string | null;
  customerEmail: string | null;
  walletAddress: string | null;
  amountUsdc: number | null;
  currency: string | null;
  paidAt: string | null;
  startDate: string | null;
  nextBillingDate: string | null;
};

type ResolvedContext = {
  userId: string | null;
  planId: string | null;
  subscriptionId: string | null;
  walletAddress: string | null;
};

function getHeaderValue(headers: Headers, candidates: string[]): string | null {
  for (const headerName of candidates) {
    const value = headers.get(headerName);
    if (value) return value;
  }
  return null;
}

function normalizeSignature(signature: string): string {
  return signature.trim().replace(/^sha256=/i, "").replace(/^v1=/i, "");
}

function getSignatureCandidates(rawBody: string, timestamp: string | null, secret: string): string[] {
  const signedPayload = timestamp ? `${timestamp}.${rawBody}` : rawBody;
  const digest = createHmac("sha256", secret).update(signedPayload).digest();
  return [digest.toString("hex"), digest.toString("base64")];
}

function isValidSignature(rawBody: string, timestamp: string | null, signature: string, secret: string): boolean {
  const normalizedSignature = normalizeSignature(signature);
  const candidates = getSignatureCandidates(rawBody, timestamp, secret);

  return candidates.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate);
    const signatureBuffer = Buffer.from(normalizedSignature);
    if (candidateBuffer.length !== signatureBuffer.length) return false;
    return timingSafeEqual(candidateBuffer, signatureBuffer);
  });
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseIsoDate(value: unknown): string | null {
  const asString = readString(value);
  if (!asString) return null;

  const asDate = new Date(asString);
  if (Number.isNaN(asDate.getTime())) return null;
  return asDate.toISOString();
}

function toUuid(value: string | null): string | null {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function extractIdentifiers(payload: WebhookPayload): WebhookIdentifiers {
  const data = readRecord(payload.data);
  const payment = readRecord(payload.payment);
  const subscription = readRecord(payload.subscription);
  const customer = readRecord(payload.customer);
  const topMetadata = readRecord(payload.metadata);
  const dataMetadata = readRecord(data?.metadata);
  const paymentMetadata = readRecord(payment?.metadata);
  const subscriptionMetadata = readRecord(subscription?.metadata);

  const metadata = dataMetadata ?? paymentMetadata ?? subscriptionMetadata ?? topMetadata;

  const eventType =
    readString(payload.event_type) ?? readString(payload.type) ?? readString(payload.event) ?? "unknown";

  const eventId =
    readString(payload.id) ??
    readString(payload.event_id) ??
    readString(payload.message_id) ??
    readString(data?.id) ??
    readString(data?.event_id) ??
    readString(data?.message_id) ??
    null;

  const paymentId =
    readString(payment?.id) ??
    readString(data?.payment_id) ??
    readString(data?.paymentId) ??
    readString(data?.transaction_id) ??
    readString(data?.transactionId) ??
    null;

  const subscriptionId =
    readString(subscription?.id) ??
    readString(subscription?.subscription_id) ??
    readString(subscription?.subscriptionId) ??
    readString(data?.subscription_id) ??
    readString(data?.subscriptionId) ??
    null;

  const internalSubscriptionId =
    readString(data?.internal_subscription_id) ??
    readString(data?.internalSubscriptionId) ??
    readString(metadata?.internal_subscription_id) ??
    readString(metadata?.internalSubscriptionId) ??
    null;

  const checkoutSessionId =
    readString(data?.checkout_session_id) ??
    readString(data?.checkoutSessionId) ??
    readString(data?.session_id) ??
    readString(data?.sessionId) ??
    readString(payment?.checkout_session_id) ??
    readString(payment?.checkoutSessionId) ??
    readString(payment?.session_id) ??
    readString(payment?.sessionId) ??
    null;

  const customerEmail =
    readString(customer?.email) ??
    readString(data?.customer_email) ??
    readString(data?.customerEmail) ??
    readString(data?.email) ??
    readString(payment?.customer_email) ??
    readString(payment?.customerEmail) ??
    null;

  const rawWalletAddress =
    readString(data?.wallet_address) ??
    readString(data?.walletAddress) ??
    readString(subscription?.wallet_address) ??
    readString(metadata?.wallet_address) ??
    readString(metadata?.walletAddress) ??
    null;

  const walletAddress =
    rawWalletAddress && isLikelySolanaWalletAddress(rawWalletAddress) ? rawWalletAddress : null;

  const amountUsdc =
    readNumber(data?.amount_usdc) ??
    readNumber(data?.amount) ??
    readNumber(payment?.amount_usdc) ??
    readNumber(payment?.amount) ??
    readNumber(data?.amountUsd) ??
    null;

  const currency = readString(data?.currency) ?? readString(payment?.currency) ?? "USDC";

  const paidAt =
    parseIsoDate(payment?.paid_at) ??
    parseIsoDate(data?.paid_at) ??
    parseIsoDate(data?.occurred_at) ??
    parseIsoDate(data?.timestamp) ??
    new Date().toISOString();

  const startDate =
    parseIsoDate(subscription?.start_date) ??
    parseIsoDate(data?.start_date) ??
    parseIsoDate(data?.current_period_start) ??
    parseIsoDate(data?.started_at);

  const nextBillingDate =
    parseIsoDate(subscription?.next_billing_date) ??
    parseIsoDate(data?.next_billing_date) ??
    parseIsoDate(data?.renewal_at) ??
    parseIsoDate(data?.current_period_end);

  return {
    eventType,
    eventId,
    paymentId,
    subscriptionId,
    internalSubscriptionId,
    checkoutSessionId,
    customerEmail,
    walletAddress,
    amountUsdc,
    currency,
    paidAt,
    startDate,
    nextBillingDate,
  };
}

function buildEventDedupeKey(ids: WebhookIdentifiers): string | null {
  if (ids.eventId) return `dodo:${ids.eventType}:event:${ids.eventId}`;
  if (ids.paymentId) return `dodo:${ids.eventType}:payment:${ids.paymentId}`;
  if (ids.subscriptionId) return `dodo:${ids.eventType}:subscription:${ids.subscriptionId}`;
  return null;
}

function buildPaymentDedupeKey(ids: WebhookIdentifiers, payloadDigest: string): string {
  if (ids.paymentId) return `dodo:payment:${ids.paymentId}`;
  if (ids.eventId) return `dodo:event:${ids.eventId}`;
  return `dodo:delivery:${payloadDigest}`;
}

async function ensureWebhookSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          plan_id UUID,
          subscription_id UUID,
          provider_payment_id TEXT NOT NULL UNIQUE,
          provider_event_id TEXT,
          provider TEXT NOT NULL DEFAULT 'dodo',
          transaction_reference TEXT,
          amount_usdc NUMERIC(18, 6) NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USDC',
          customer_email TEXT,
          wallet_address TEXT,
          paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT payments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT payments_plan_fk FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL,
          CONSTRAINT payments_subscription_fk FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
          CONSTRAINT payments_amount_non_negative CHECK (amount_usdc >= 0)
        )
      `);

      await db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_event_id_unique
        ON payments (provider_event_id)
        WHERE provider_event_id IS NOT NULL
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_user_paid_at
        ON payments (user_id, paid_at DESC)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_payments_subscription_paid_at
        ON payments (subscription_id, paid_at DESC)
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

async function resolveContext(
  client: { query: <T>(text: string, params?: readonly unknown[]) => Promise<{ rows: T[] }> },
  ids: WebhookIdentifiers
): Promise<ResolvedContext> {
  let userId: string | null = null;
  let planId: string | null = null;
  let subscriptionId: string | null = toUuid(ids.internalSubscriptionId) ?? toUuid(ids.subscriptionId) ?? null;
  let walletAddress: string | null = ids.walletAddress;

  if (!subscriptionId && ids.checkoutSessionId) {
    const sessionResult = await client.query<{
      user_id: string;
      plan_id: string | null;
      subscription_id: string | null;
    }>(
      `SELECT user_id, plan_id, subscription_id
       FROM checkout_sessions
       WHERE checkout_session_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [ids.checkoutSessionId]
    );

    if (sessionResult.rows[0]) {
      userId = sessionResult.rows[0].user_id;
      planId = sessionResult.rows[0].plan_id;
      subscriptionId = sessionResult.rows[0].subscription_id ?? null;
    }
  }

  if (subscriptionId) {
    const subscriptionResult = await client.query<{
      user_id: string;
      plan_id: string;
    }>(
      `SELECT user_id, plan_id
       FROM subscriptions
       WHERE id = $1
       LIMIT 1`,
      [subscriptionId]
    );

    if (subscriptionResult.rows[0]) {
      userId = subscriptionResult.rows[0].user_id;
      planId = subscriptionResult.rows[0].plan_id;
    }
  }

  if (!userId && walletAddress) {
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE wallet_address = $1 LIMIT 1`,
      [walletAddress]
    );

    if (userResult.rows[0]) {
      userId = userResult.rows[0].id;
    }
  }

  if (userId && !subscriptionId) {
    const latestSubscriptionResult = await client.query<{ id: string; plan_id: string }>(
      `SELECT id, plan_id
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (latestSubscriptionResult.rows[0]) {
      subscriptionId = latestSubscriptionResult.rows[0].id;
      planId = latestSubscriptionResult.rows[0].plan_id;
    }
  }

  if (userId && !walletAddress) {
    const walletResult = await client.query<{ wallet_address: string }>(
      `SELECT wallet_address FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    walletAddress = walletResult.rows[0]?.wallet_address ?? null;
  }

  return {
    userId,
    planId,
    subscriptionId,
    walletAddress,
  };
}

async function insertSubscriptionEvent(
  client: { query: <T>(text: string, params?: readonly unknown[]) => Promise<{ rows: T[] }> },
  input: {
    userId: string;
    subscriptionId: string | null;
    amountUsdc: number | null;
    eventType:
      | "payment_success"
      | "payment_failed"
      | "webhook_received"
      | "webhook_processed"
      | "subscription_created"
      | "subscription_canceled";
    providerEventId: string | null;
    payload: Record<string, unknown>;
  }
): Promise<boolean> {
  if (!input.providerEventId) {
    await client.query(
      `INSERT INTO subscription_events (
        user_id, subscription_id, amount_usdc, event_type, provider_event_id, payload, occurred_at
      ) VALUES ($1, $2, $3, $4, NULL, $5::jsonb, NOW())`,
      [
        input.userId,
        input.subscriptionId,
        input.amountUsdc,
        input.eventType,
        JSON.stringify(input.payload),
      ]
    );
    return true;
  }

  const inserted = await client.query<{ id: string }>(
    `INSERT INTO subscription_events (
      user_id, subscription_id, amount_usdc, event_type, provider_event_id, payload, occurred_at
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
    ON CONFLICT (provider_event_id) DO NOTHING
    RETURNING id`,
    [
      input.userId,
      input.subscriptionId,
      input.amountUsdc,
      input.eventType,
      input.providerEventId,
      JSON.stringify(input.payload),
    ]
  );

  return Boolean(inserted.rows[0]);
}

function getDefaultNextBillingDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

async function handlePaymentSucceeded(
  client: { query: <T>(text: string, params?: readonly unknown[]) => Promise<{ rows: T[] }> },
  ids: WebhookIdentifiers,
  context: ResolvedContext,
  payload: Record<string, unknown>,
  payloadDigest: string
) {
  if (!context.userId) {
    console.warn("[dodo-webhook] payment.succeeded ignored: user not found", {
      paymentId: ids.paymentId,
      subscriptionId: ids.subscriptionId,
      customerEmail: ids.customerEmail,
    });
    return;
  }

  let amountUsdc = ids.amountUsdc;
  if (amountUsdc === null && context.planId) {
    const planResult = await client.query<{ price_usdc: string }>(
      `SELECT price_usdc FROM plans WHERE id = $1 LIMIT 1`,
      [context.planId]
    );
    if (planResult.rows[0]) {
      const parsedPrice = Number(planResult.rows[0].price_usdc);
      amountUsdc = Number.isFinite(parsedPrice) ? parsedPrice : 0;
    }
  }

  const dedupePaymentId = buildPaymentDedupeKey(ids, payloadDigest);
  const eventDedupeKey = buildEventDedupeKey(ids);

  const paymentInsert = await client.query<{ id: string }>(
    `INSERT INTO payments (
      user_id,
      plan_id,
      subscription_id,
      provider_payment_id,
      provider_event_id,
      provider,
      amount_usdc,
      currency,
      customer_email,
      wallet_address,
      paid_at,
      payload
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::jsonb)
    ON CONFLICT (provider_payment_id) DO NOTHING
    RETURNING id`,
    [
      context.userId,
      context.planId,
      context.subscriptionId,
      dedupePaymentId,
      eventDedupeKey,
      "dodo",
      amountUsdc ?? 0,
      ids.currency ?? "USDC",
      ids.customerEmail,
      context.walletAddress,
      ids.paidAt ?? new Date().toISOString(),
      JSON.stringify(payload),
    ]
  );

  const wasInserted = Boolean(paymentInsert.rows[0]);
  if (!wasInserted) {
    console.info("[dodo-webhook] payment.succeeded duplicate ignored", {
      paymentDedupeKey: dedupePaymentId,
    });
    return;
  }

    await insertSubscriptionEvent(client, {
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      amountUsdc: amountUsdc ?? 0,
      eventType: "payment_success",
      providerEventId: eventDedupeKey,
      payload,
    });

    // Record to dashboard (jsonDb)
    await recordSubscriptionEvent({
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      amountUsdc: amountUsdc ?? 0,
      eventType: "payment_success",
      provider: "dodo",
      providerEventId: eventDedupeKey,
      payload,
    });
}

async function handleSubscriptionActiveLike(
  client: { query: <T>(text: string, params?: readonly unknown[]) => Promise<{ rows: T[] }> },
  ids: WebhookIdentifiers,
  context: ResolvedContext,
  payload: Record<string, unknown>
) {
  if (!context.userId || !context.subscriptionId) {
    console.warn("[dodo-webhook] subscription event ignored: subscription or user not found", {
      eventType: ids.eventType,
      subscriptionId: ids.subscriptionId,
      customerEmail: ids.customerEmail,
    });
    return;
  }

  const eventDedupeKey = buildEventDedupeKey(ids);

  const inserted = await insertSubscriptionEvent(client, {
    userId: context.userId,
    subscriptionId: context.subscriptionId,
    amountUsdc: ids.amountUsdc,
    eventType: ids.eventType === "subscription.active" ? "subscription_created" : "webhook_processed",
    providerEventId: eventDedupeKey,
    payload,
  });

    if (!inserted) {
      console.info("[dodo-webhook] duplicate subscription event ignored", {
        providerEventId: eventDedupeKey,
      });
      return;
    }

    // Record to dashboard (jsonDb)
    await recordSubscriptionEvent({
      userId: context.userId,
      subscriptionId: context.subscriptionId,
      amountUsdc: ids.amountUsdc,
      eventType: ids.eventType === "subscription.active" ? "subscription_created" : "webhook_processed",
      provider: "dodo",
      providerEventId: eventDedupeKey,
      payload,
    });

  await client.query(
    `UPDATE subscriptions
     SET status = 'active',
         start_date = COALESCE($2::timestamptz, start_date, NOW()),
         next_billing_date = COALESCE($3::timestamptz, next_billing_date, $4::timestamptz),
         updated_at = NOW()
     WHERE id = $1`,
    [
      context.subscriptionId,
      ids.startDate,
      ids.nextBillingDate,
      getDefaultNextBillingDate(),
    ]
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const ids = extractIdentifiers(payload);
  const recordedEvent = recordDodoWebhookEvent({
    eventType: ids.eventType,
    subscriptionId: ids.subscriptionId,
    customerEmail: ids.customerEmail,
    paymentId: ids.paymentId,
    payload,
  });

  console.log("[dodo-webhook] received", {
    eventType: ids.eventType,
    eventId: ids.eventId,
    paymentId: ids.paymentId,
    subscriptionId: ids.subscriptionId,
    customerEmail: ids.customerEmail,
    walletAddress: ids.walletAddress,
  });

  const signature = getHeaderValue(req.headers, SIGNATURE_HEADERS);
  const timestamp = getHeaderValue(req.headers, TIMESTAMP_HEADERS);

  if (DODO_WEBHOOK_SECRET) {
    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature." }, { status: 401 });
    }

    if (!isValidSignature(rawBody, timestamp, signature, DODO_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  } else {
    console.warn("[dodo-webhook] DODO_WEBHOOK_SECRET not configured; signature verification skipped");
  }

  if (!SUPPORTED_EVENTS.has(ids.eventType)) {
    return NextResponse.json(
      {
        ok: true,
        ignored: true,
        eventType: ids.eventType,
      },
      { status: 200 }
    );
  }

  const payloadDigest = createHash("sha256").update(rawBody).digest("hex");

  try {
    await ensureWebhookSchema();

    await db.withTransaction(async (client) => {
      const context = await resolveContext(client, ids);

      if (ids.eventType === "payment.succeeded") {
        await handlePaymentSucceeded(client, ids, context, payload, payloadDigest);
        return;
      }

      if (ids.eventType === "subscription.active" || ids.eventType === "subscription.renewed") {
        await handleSubscriptionActiveLike(client, ids, context, payload);
      }
    });
  } catch (error) {
    console.error("[dodo-webhook] failed to process", {
      eventType: ids.eventType,
      error: error instanceof Error ? error.message : error,
    });
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      eventType: recordedEvent.eventType,
      subscriptionId: recordedEvent.subscriptionId,
      customerEmail: recordedEvent.customerEmail,
    },
    { status: 200 }
  );
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
