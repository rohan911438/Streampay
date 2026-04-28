import { NextResponse } from "next/server";
import { getMagicBlockService } from "@/lib/magicblock-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * MagicBlock Test Endpoint
 * Verifies transaction building via MagicBlock Execution Layer.
 */
export async function GET() {
  console.log("[Test] Initiating MagicBlock connectivity test...");
  
  const magicBlock = getMagicBlockService();
  
  const testPayload = {
    from: "GfK6fP7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3B",
    to: "Hk4p6N7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3C",
    mint: "EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM",
    amount: 5000
  };

  try {
    const transactionData = await magicBlock.testConnectivity(testPayload);
    
    console.log("[Test] MagicBlock Response received successfully.");
    
    return NextResponse.json({
      success: true,
      provider: "MagicBlock",
      transactionBase64: transactionData.transactionBase64,
      metadata: {
        blockhash: transactionData.recentBlockhash,
        signers: transactionData.requiredSigners
      }
    });
  } catch (error) {
    console.error("[Test] MagicBlock check failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
