import { NextResponse } from "next/server";
import { getMagicBlockService } from "@/lib/magicblock-service";
import { recordSubscriptionEvent } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cloak Payment Test Endpoint
 * Simulates a private payment flow and verifies database storage.
 */
export async function GET() {
  console.log("[Test] Initiating Cloak payment simulation...");
  
  const magicBlock = getMagicBlockService();
  
  try {
    // 1. Simulate the routing layer
    console.log("[Test] Routing via MagicBlock...");
    
    // We use a random keypair for simulation
    const { Keypair } = await import("@solana/web3.js");
    const dummyKey = Keypair.generate().secretKey;
    
    const result = await magicBlock.processAndRoutePrivatePayment(
      dummyKey,
      "GfK6fP7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3B",
      1000000, // 1 USDC
      { description: "Cloak Integration Test" }
    );

    // 2. Record in Database
    console.log("[Test] Storing transaction in DB...");
    await recordSubscriptionEvent({
      userId: "test-user-cloak",
      subscriptionId: "test-sub-cloak",
      eventType: "payment_success",
      provider: "cloak",
      executionLayer: "magicblock",
      amountUsdc: 1,
      payload: {
        txSignature: result.transactionSignature,
        magicBlockRef: result.magicBlockReference
      }
    });

    return NextResponse.json({
      success: true,
      cloak: "executed",
      database: "updated",
      transaction: result
    });
  } catch (error) {
    console.error("[Test] Cloak payment simulation failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
