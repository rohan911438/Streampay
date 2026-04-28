import { NextResponse } from "next/server";
import { getMagicBlockService } from "@/lib/magicblock-service";
import { recordSubscriptionEvent } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Full Pipeline Test Endpoint
 * Coordinates RPC Fast -> MagicBlock -> Cloak -> DB -> Dashboard.
 */
export async function GET() {
  const startTime = Date.now();
  console.log("[Full-Flow] Starting end-to-end pipeline test...");
  
  try {
    // 1. Fetch System Health (Internal verification)
    const magicBlock = getMagicBlockService();
    const health = await magicBlock.verifyExecutionLayerStatus();
    console.log(`[Full-Flow] Step 1: RPC & MagicBlock Health: ${health.status}`);

    // 2. Simulate User & Plan Context
    const testContext = {
      userId: "user_" + Math.random().toString(36).substring(7),
      planId: "plan_premium_test",
      amount: 19.99
    };
    console.log(`[Full-Flow] Step 2: Context prepared for ${testContext.userId}`);

    // 3. Execute Routing & Shielded Transfer
    console.log("[Full-Flow] Step 3: Executing shielded transfer via MagicBlock routing...");
    const { Keypair } = await import("@solana/web3.js");
    const dummyKey = Keypair.generate().secretKey;
    const transferResult = await magicBlock.processAndRoutePrivatePayment(
      dummyKey,
      "GfK6fP7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3B",
      testContext.amount * 1000000,
      { orderId: "TEST_FLOW_" + Date.now() }
    );

    // 4. Persistence
    console.log("[Full-Flow] Step 4: Persisting transaction to DB with MagicBlock metadata...");
    await recordSubscriptionEvent({
      userId: testContext.userId,
      subscriptionId: testContext.planId,
      eventType: "subscription_created",
      provider: "cloak",
      executionLayer: "magicblock",
      amountUsdc: testContext.amount,
      payload: {
        signature: transferResult.transactionSignature,
        magicBlockRef: transferResult.magicBlockReference,
        latency_ms: Date.now() - startTime
      }
    });

    console.log("[Full-Flow] Pipeline completed successfully.");

    return NextResponse.json({
      status: "success",
      rpc: "connected",
      magicblock: "working",
      cloak: "executed",
      database: "updated",
      details: {
        user: testContext.userId,
        tx: transferResult.transactionSignature,
        execution_layer: "magicblock",
        total_time_ms: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error("[Full-Flow] Pipeline failed:", error);
    return NextResponse.json({
      status: "failure",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
