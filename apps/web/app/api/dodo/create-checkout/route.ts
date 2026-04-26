import { NextResponse } from "next/server";
import {
  createPendingSubscription,
  findOrCreateUserByWallet,
  isLikelySolanaWalletAddress,
  recordSubscriptionEvent,
  resolveCheckoutPlan,
} from "@/lib/subscriptions-db";

type CreateCheckoutRequestBody = {
  email?: string;
  name?: string;
  walletAddress?: string;
};

type DodoCheckoutResponse = {
  checkout_url?: unknown;
  data?: {
    checkout_url?: unknown;
  };
  checkout?: {
    url?: unknown;
  };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DODO_API_BASE_URL = process.env.DODO_API_BASE_URL ?? "https://test.dodopayments.com";
const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_SUBSCRIPTION_PRODUCT_ID = process.env.DODO_SUBSCRIPTION_PRODUCT_ID;
const DODO_SUCCESS_URL = process.env.DODO_SUCCESS_URL;
const DODO_CANCEL_URL = process.env.DODO_CANCEL_URL;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractCheckoutUrl(response: DodoCheckoutResponse): string | null {
  const candidates = [
    response.checkout_url,
    response.data?.checkout_url,
    response.checkout?.url,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

export async function POST(req: Request) {
  if (!DODO_API_KEY || !DODO_SUBSCRIPTION_PRODUCT_ID) {
    return NextResponse.json(
      { error: "Server payment configuration is incomplete." },
      { status: 500 }
    );
  }

  let body: CreateCheckoutRequestBody;

  try {
    body = (await req.json()) as CreateCheckoutRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = body.email?.trim();
  const name = body.name?.trim();
  const walletAddress = body.walletAddress?.trim();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "A valid name is required." }, { status: 400 });
  }

  if (!walletAddress || !isLikelySolanaWalletAddress(walletAddress)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  let userId: string;
  let pendingSubscriptionId: string;

  try {
    const user = await findOrCreateUserByWallet(walletAddress);
    const plan = await resolveCheckoutPlan(DODO_SUBSCRIPTION_PRODUCT_ID);
    const pendingSubscription = await createPendingSubscription(user.id, plan);

    userId = user.id;
    pendingSubscriptionId = pendingSubscription.id;
  } catch (error) {
    console.error("[create-checkout] failed to prepare subscription", error);
    return NextResponse.json({ error: "Failed to initialize subscription." }, { status: 500 });
  }

  const checkoutPayload = {
    mode: "test",
    product_id: DODO_SUBSCRIPTION_PRODUCT_ID,
    customer: {
      email,
      name,
    },
    metadata: {
      internal_subscription_id: pendingSubscriptionId,
      wallet_address: walletAddress,
      user_id: userId,
    },
    ...(DODO_SUCCESS_URL ? { success_url: DODO_SUCCESS_URL } : {}),
    ...(DODO_CANCEL_URL ? { cancel_url: DODO_CANCEL_URL } : {}),
  };

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(`${DODO_API_BASE_URL}/v1/checkout-sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach payment provider." },
      { status: 502 }
    );
  }

  let dodoResponse: DodoCheckoutResponse = {};

  try {
    dodoResponse = (await upstreamResponse.json()) as DodoCheckoutResponse;
  } catch {
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Payment provider returned an invalid response." },
        { status: 502 }
      );
    }
  }

  if (!upstreamResponse.ok) {
    await recordSubscriptionEvent({
      userId,
      subscriptionId: pendingSubscriptionId,
      eventType: "payment_failed",
      payload: {
        reason: "checkout_provider_rejected",
      },
    });

    return NextResponse.json(
      { error: "Payment provider rejected the checkout session request." },
      { status: 502 }
    );
  }

  const checkoutUrl = extractCheckoutUrl(dodoResponse);

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Payment provider response did not include checkout_url." },
      { status: 502 }
    );
  }

  await recordSubscriptionEvent({
    userId,
    subscriptionId: pendingSubscriptionId,
    eventType: "subscription_created",
    payload: {
      checkout_url: checkoutUrl,
      provider: "dodo",
    },
  });

  return NextResponse.json({ checkout_url: checkoutUrl, subscription_id: pendingSubscriptionId }, { status: 200 });
}