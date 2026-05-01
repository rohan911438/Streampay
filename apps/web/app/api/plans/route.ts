import { NextResponse } from "next/server";
import { jsonDb } from "@/lib/json-db";
import { db } from "@paystream/db";
import { dbConfig } from "@/lib/db-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export async function GET() {
  try {
    let plans: any[] = [];
    if (dbConfig.shouldTryPostgres()) {
      try {
        const result = await db.query("SELECT * FROM plans WHERE is_active = true ORDER BY created_at ASC");
        plans = result.rows.map(row => ({
          id: row.id,
          name: row.name,
          priceUsdc: Number(row.price_usdc),
          billingInterval: row.billing_interval,
          description: row.description,
          active: row.is_active
        }));
      } catch (err) {
        console.error("[plans] Postgres fetch failed:", err);
      }
    }

    if (plans.length === 0) {
      plans = await jsonDb.listPlans();
    }

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
    let plan = null;
    if (dbConfig.shouldTryPostgres()) {
      try {
        plan = await db.insert("plans", {
          name,
          description,
          price_usdc: priceUsdc,
          billing_interval: billingInterval,
          is_active: true
        });
      } catch (err) {
        console.error("[plans] Postgres insert failed:", err);
      }
    }

    if (!plan) {
      plan = await jsonDb.createPlan({
        name,
        priceUsdc,
        billingInterval,
        description,
      });
    }

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