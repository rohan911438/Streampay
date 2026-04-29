import { NextRequest, NextResponse } from "next/server";
import { withPlatformAuth, platformError } from "@/lib/platform-auth";
import { db } from "@paystream/db";
import { jsonDb } from "@/lib/json-db";

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

export const PATCH = withPlatformAuth(async (req, { merchant }) => {
  try {
    const body = await req.json();
    const { webhook_url } = body;

    if (webhook_url !== undefined && webhook_url !== null) {
      if (webhook_url !== "" && !webhook_url.startsWith("http")) {
        return platformError("Webhook URL must be a valid HTTP/HTTPS URL", 400);
      }
    }

    let updatedMerchant;
    try {
      updatedMerchant = await db.update(
        "merchants",
        { 
          webhook_url: webhook_url || null,
          updated_at: new Date()
        },
        "id = $1",
        [merchant.id]
      );
    } catch (dbErr) {
      console.error("[MerchantAPI] SQL Update failed, falling back to JSON DB:", dbErr);
      updatedMerchant = await jsonDb.updateMerchant(merchant.id, { 
        webhook_url: webhook_url || null 
      });
    }

    if (!updatedMerchant) {
      return platformError("Failed to update merchant settings", 500);
    }

    // Now updatedMerchant is narrowed to QueryResultRow
    return NextResponse.json({
      id: updatedMerchant["id"],
      name: updatedMerchant["name"],
      webhook_url: updatedMerchant["webhook_url"],
      message: "Merchant settings updated successfully"
    });
  } catch (err) {
    console.error("Error updating merchant:", err);
    return platformError("Failed to update merchant settings", 500);
  }
});
