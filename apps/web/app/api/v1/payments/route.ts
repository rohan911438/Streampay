import { NextRequest, NextResponse } from "next/server";
import { validatePlatformRequest, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { merchant, error, status } = await validatePlatformRequest(req);
  
  if (error || !merchant) {
    return platformError(error || "Unauthorized", status);
  }

  try {
    const result = await db.query(
      `SELECT id, amount_usdc, currency, paid_at, provider_payment_id, wallet_address 
       FROM payments 
       WHERE merchant_id = $1 
       ORDER BY paid_at DESC 
       LIMIT 100`,
      [merchant.id]
    );

    return NextResponse.json({
      payments: result.rows,
    });
  } catch (err) {
    console.error("Failed to fetch payments:", err);
    return platformError("Internal server error", 500);
  }
}
