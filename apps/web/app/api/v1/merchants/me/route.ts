import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withPlatformAuth(async (req, { merchant }) => {
  return NextResponse.json({
    id: merchant.id,
    name: merchant.name,
    wallet_address: merchant.wallet_address,
    webhook_url: merchant.webhook_url,
  });
});
