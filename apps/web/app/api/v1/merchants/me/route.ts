import { NextRequest, NextResponse } from "next/server";
import { validatePlatformRequest, platformError } from "@/lib/platform-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { merchant, error, status } = await validatePlatformRequest(req);
  
  if (error || !merchant) {
    return platformError(error || "Unauthorized", status);
  }

  return NextResponse.json({
    id: merchant.id,
    name: merchant.name,
    wallet_address: merchant.wallet_address,
    webhook_url: merchant.webhook_url,
    created_at: merchant.created_at,
  });
}
