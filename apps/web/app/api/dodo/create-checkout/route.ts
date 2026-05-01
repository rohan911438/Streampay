import { NextResponse } from "next/server";
import { jsonDb } from "@/lib/json-db";

type CreateCheckoutRequestBody = {
  email?: string;
  name?: string;
  walletAddress?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isLikelySolanaWalletAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export async function POST(req: Request) {
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

  try {
    // Get or create user
    const user = await jsonDb.findOrCreateUser(walletAddress);

    // Get the first available plan (or specific one if needed)
    const plans = await jsonDb.listPlans();
    const plan = plans[0];

    if (!plan) {
      return NextResponse.json({ error: "No plans available." }, { status: 400 });
    }

    // Create pending subscription
    const subscription = await jsonDb.createSubscription({
      userId: user.id,
      planId: plan.id,
      status: "pending",
    });

    // Create checkout session
    const checkoutSession = await jsonDb.createCheckoutSession({
      userId: user.id,
      planId: plan.id,
      subscriptionId: subscription.id,
    });

    // Record subscription_created event
    await jsonDb.recordSubscriptionEvent({
      subscriptionId: subscription.id,
      eventType: "subscription_created",
      provider: "dodo",
      amountUsdc: plan.priceUsdc,
      metadata: {
        email,
        name,
        walletAddress,
      },
    });

    // For now, return a mock checkout URL (replace with real Dodo URL when API works)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const checkoutUrl = `${appUrl}/pay/success?session=${checkoutSession.checkoutSessionId}&test=true`;

    return NextResponse.json(
      {
        checkout_url: checkoutUrl,
        subscription_id: subscription.id,
        checkout_session_id: checkoutSession.checkoutSessionId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[create-checkout] failed", error);
    return NextResponse.json(
      { error: "Failed to create checkout." },
      { status: 500 }
    );
  }
}