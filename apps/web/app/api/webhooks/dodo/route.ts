import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { recordDodoWebhookEvent } from "@/lib/dodo-webhook-state";

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
