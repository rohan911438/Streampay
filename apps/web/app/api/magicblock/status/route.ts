import { NextResponse } from "next/server";
import { getMagicBlockService } from "@/lib/magicblock-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demonstrable endpoint for MagicBlock Infrastructure monitoring.
 * This explicitly interacts with the MagicBlock Private Payments API
 * to verify the health and status of the execution layer.
 */
export async function GET() {
  const magicBlock = getMagicBlockService();
  
  try {
    console.log("[API] MagicBlock Status Check initiated...");
    
    // Active interaction with the MagicBlock service layer
    const status = await magicBlock.verifyExecutionLayerStatus();
    
    return NextResponse.json({
      success: true,
      service: "MagicBlock Private Payments",
      status: status.status,
      latency_ms: status.latency,
      environment: status.environment,
      features: [
        "Shielded Transfer Routing",
        "Ephemeral State Optimization",
        "ZK-Proof Acceleration"
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "MagicBlock Execution Layer unreachable",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 503 });
  }
}
