import { NextResponse } from "next/server";
import { jsonDb } from "@/lib/json-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function GET() {
  try {
    const plans = await jsonDb.listPlans();
    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("[plans] failed to list plans", error);
    return NextResponse.json({ error: "Failed to load plans." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: any;

  try {
    body = (await req.json()) as any;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = body.name?.trim();
  const description = body.description?.trim() || null;
  const billingInterval = body.billingInterval;
  const priceUsdc = body.priceUsdc;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "A valid plan name is required." }, { status: 400 });
  }

  if (!isPositiveNumber(priceUsdc)) {
    return NextResponse.json({ error: "A valid USDC price is required." }, { status: 400 });
  }

  if (billingInterval !== "monthly" && billingInterval !== "yearly") {
    return NextResponse.json({ error: "Billing interval must be monthly or yearly." }, { status: 400 });
  }

  try {
    const plan = await jsonDb.createPlan({
      name,
      priceUsdc,
      billingInterval,
      description,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("[plans] failed to create plan", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create plan.",
      },
      { status: 502 }
    );
  }
}