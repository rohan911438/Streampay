import { NextResponse } from "next/server";
import { getMagicBlockService } from "@/lib/magicblock-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backend test endpoint to verify MagicBlock connectivity.
 * Uses a fixed sample payload to build a private transaction.
 */
export async function GET() {
  const magicBlock = getMagicBlockService();
  
  // Fixed test payload with valid structures
  const testPayload = {
    from: "GfK6fP7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3B", // Sample valid Solana address
    to: "Hk4p6N7vW1uN5N5m8WJp3Xk9R8z6Jp6Y7a3Z1Xm2Yn3C",   // Sample valid recipient
    mint: "EPjFWdd5Au17i3ANF1qLFbgcCzKxwKnhNzrGg44oMWRM", // Mainnet USDC Mint
    amount: 1000 // 1000 base units (0.001 USDC)
  };

  try {
    console.log("[API] MagicBlock Connectivity Test initiated...");
    
    // Call the test method in the service
    const transactionData = await magicBlock.testConnectivity(testPayload);
    
    return NextResponse.json({
      success: true,
      transaction: {
        transactionBase64: transactionData.transactionBase64,
        recentBlockhash: transactionData.recentBlockhash,
        requiredSigners: transactionData.requiredSigners
      }
    });
  } catch (error) {
    console.error("[API] MagicBlock Connectivity Test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: "MagicBlock connectivity failure",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
