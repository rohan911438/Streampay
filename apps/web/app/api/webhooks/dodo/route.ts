import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { recordDodoWebhookEvent } from "@/lib/dodo-webhook-state";
import {
  findOrCreateUserByWallet,
  isLikelySolanaWalletAddress,
  findUserIdBySubscriptionId,
  findLatestSubscriptionIdForUser,
  recordSubscriptionEvent,
  updateCheckoutSessionRecordStatus,
  updateSubscriptionStatus,
} from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET;
const SIGNATURE_HEADERS = [
  "x-dodo-signature",
  "x-dodo-webhook-signature",
  "dodo-signature",
  "x-webhook-signature",
];
const TIMESTAMP_HEADERS = ["x-dodo-timestamp", "dodo-timestamp", "x-webhook-timestamp"];

type WebhookPayload = Record<string, unknown> & {
  event_type?: unknown;
  type?: unknown;
  event?: unknown;
  data?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
  customer?: Record<string, unknown>;
  payment?: Record<string, unknown>;
};

function getHeaderValue(headers: Headers, candidates: string[]): string | null {
  for (const headerName of candidates) {
    const value = headers.get(headerName);
    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeSignature(signature: string): string {
  return signature.trim().replace(/^sha256=/i, "").replace(/^v1=/i, "");
}

function getSignatureCandidates(rawBody: string, timestamp: string | null, secret: string): string[] {
  const encodedPayload = timestamp ? `${timestamp}.${rawBody}` : rawBody;
  const digest = createHmac("sha256", secret).update(encodedPayload).digest();

  return [digest.toString("hex"), digest.toString("base64")];
}

function isValidSignature(rawBody: string, timestamp: string | null, signature: string, secret: string): boolean {
  const normalizedSignature = normalizeSignature(signature);
  const candidates = getSignatureCandidates(rawBody, timestamp, secret);

  return candidates.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate);
    const signatureBuffer = Buffer.from(normalizedSignature);

    if (candidateBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(candidateBuffer, signatureBuffer);
  });
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function extractEventType(payload: WebhookPayload): string | null {
  return readString(payload.event_type) ?? readString(payload.type) ?? readString(payload.event);
}

function extractIdentifiers(payload: WebhookPayload) {
  const subscriptionId =
    readString(payload.subscription?.id) ??
    readString(payload.data?.subscription_id) ??
    readString(payload.data?.subscriptionId) ??
    readString(payload.subscription?.subscription_id) ??
    readString(payload.subscription?.subscriptionId) ??
    null;

  const customerEmail =
    readString(payload.customer?.email) ??
    readString(payload.data?.customer_email) ??
    readString(payload.data?.customerEmail) ??
    readString(payload.data?.email) ??
    null;

  const paymentId =
    readString(payload.payment?.id) ??
    readString(payload.data?.payment_id) ??
    readString(payload.data?.paymentId) ??
    readString(payload.data?.transaction_id) ??
    readString(payload.data?.transactionId) ??
    null;

  return { subscriptionId, customerEmail, paymentId };
}

function extractWalletAddress(payload: WebhookPayload): string | null {
  const walletAddress =
    readString(payload.data?.wallet_address) ??
    readString(payload.data?.walletAddress) ??
    readString(payload.data?.metadata && (payload.data.metadata as Record<string, unknown>).wallet_address) ??
    readString(payload.data?.metadata && (payload.data.metadata as Record<string, unknown>).walletAddress) ??
    readString(payload.subscription?.wallet_address) ??
    null;

  if (!walletAddress) return null;
  return isLikelySolanaWalletAddress(walletAddress) ? walletAddress : null;
}

function extractInternalSubscriptionId(payload: WebhookPayload): string | null {
  return (
    readString(payload.data?.internal_subscription_id) ??
    readString(payload.data?.internalSubscriptionId) ??
    readString(payload.data?.metadata && (payload.data.metadata as Record<string, unknown>).internal_subscription_id) ??
    readString(payload.data?.metadata && (payload.data.metadata as Record<string, unknown>).internalSubscriptionId) ??
    null
  );
}

function extractAmountUsdc(payload: WebhookPayload): number | null {
  const amountCandidate =
    payload.data?.amount ??
    payload.data?.amount_usdc ??
    payload.payment?.amount ??
    payload.payment?.amount_usdc;

  if (typeof amountCandidate === "number" && Number.isFinite(amountCandidate)) {
    return amountCandidate;
  }

  if (typeof amountCandidate === "string") {
    const parsed = Number(amountCandidate);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractCheckoutSessionId(payload: WebhookPayload): string | null {
  const candidates = [
    payload.data?.checkout_session_id,
    payload.data?.checkoutSessionId,
    payload.data?.session_id,
    payload.data?.sessionId,
    payload.data?.payment_id,
    payload.data?.paymentId,
    payload.payment?.checkout_session_id,
    payload.payment?.checkoutSessionId,
    payload.payment?.session_id,
    payload.payment?.sessionId,
    payload.payment?.id,
    payload.subscription?.checkout_session_id,
    payload.subscription?.checkoutSessionId,
    payload.subscription?.session_id,
    payload.subscription?.sessionId,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function mapEventTypeToStatus(eventType: string): "active" | "pending" | "canceled" | null {
  if (eventType === "payment.succeeded" || eventType === "subscription.active" || eventType === "subscription.renewed") {
    return "active";
  }

  if (eventType === "payment.failed") {
    return "pending";
  }

  if (eventType === "subscription.canceled") {
    return "canceled";
  }

  return null;
}

function mapEventTypeToCheckoutStatus(eventType: string): "pending" | "completed" | "failed" | "expired" {
  if (eventType === "payment.succeeded" || eventType === "subscription.active" || eventType === "subscription.renewed") {
    return "completed";
  }

  if (eventType === "payment.failed") {
    return "failed";
  }

  if (eventType === "subscription.canceled") {
    return "expired";
  }

  return "pending";
}

function mapEventTypeToLogType(eventType: string):
  | "payment_success"
  | "payment_failed"
  | "webhook_received"
  | "webhook_processed"
  | "subscription_created"
  | "subscription_canceled" {
  if (eventType === "payment.succeeded" || eventType === "subscription.renewed") {
    return "payment_success";
  }

  if (eventType === "payment.failed") {
    return "payment_failed";
  }

  if (eventType === "subscription.active") {
    return "subscription_created";
  }

  if (eventType === "subscription.canceled") {
    return "subscription_canceled";
  }

  return "webhook_processed";
}

export async function POST(req: Request) {
  if (!DODO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const signature = getHeaderValue(req.headers, SIGNATURE_HEADERS);

  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature." }, { status: 401 });
  }

  const timestamp = getHeaderValue(req.headers, TIMESTAMP_HEADERS);
  const rawBody = await req.text();

  if (!isValidSignature(rawBody, timestamp, signature, DODO_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: WebhookPayload;

  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = extractEventType(payload);

  if (!eventType) {
    return NextResponse.json({ error: "Missing event type." }, { status: 400 });
  }

  const identifiers = extractIdentifiers(payload);
  const walletAddress = extractWalletAddress(payload);
  const checkoutSessionId = extractCheckoutSessionId(payload) ?? identifiers.paymentId;
  const internalSubscriptionId = extractInternalSubscriptionId(payload);
  const amountUsdc = extractAmountUsdc(payload);

  const recordedEvent = recordDodoWebhookEvent({
    eventType,
    subscriptionId: identifiers.subscriptionId,
    customerEmail: identifiers.customerEmail,
    paymentId: identifiers.paymentId,
    payload,
  });

  console.log("[dodo-webhook]", {
    eventType: recordedEvent.eventType,
    subscriptionId: recordedEvent.subscriptionId,
    customerEmail: recordedEvent.customerEmail,
    paymentId: recordedEvent.paymentId,
  });

  try {
    let userId: string | null = null;
    let subscriptionId: string | null = internalSubscriptionId ?? identifiers.subscriptionId ?? null;

    if (walletAddress) {
      const user = await findOrCreateUserByWallet(walletAddress);
      userId = user.id;
    }

    if (!userId && subscriptionId) {
      userId = await findUserIdBySubscriptionId(subscriptionId);
    }

    if (userId && !subscriptionId) {
      subscriptionId = await findLatestSubscriptionIdForUser(userId);
    }

    if (userId) {
      await recordSubscriptionEvent({
        userId,
        subscriptionId,
        amountUsdc,
        eventType: mapEventTypeToLogType(eventType),
        providerEventId: identifiers.paymentId,
        payload,
      });

      const nextStatus = mapEventTypeToStatus(eventType);

      if (nextStatus && subscriptionId) {
        await updateSubscriptionStatus({
          subscriptionId,
          status: nextStatus,
        });
      }

      if (checkoutSessionId || subscriptionId) {
        await updateCheckoutSessionRecordStatus({
          checkoutSessionId,
          subscriptionId,
          status: mapEventTypeToCheckoutStatus(eventType),
        });
      }
    }
  } catch (error) {
    console.error("[dodo-webhook] failed to persist event", error);
    return NextResponse.json({ error: "Failed to persist webhook event." }, { status: 500 });
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
