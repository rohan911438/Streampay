import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { getMagicBlockService } from "@/lib/magicblock-service";
import { jsonDb } from "@/lib/json-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * System Health Check Endpoint
 * Verifies connectivity to RPC Fast, MagicBlock, and the Database.
 */
export async function GET() {
  console.log("[Health] Initiating system-wide health check...");
  
  const results = {
    rpc: { status: "pending", endpoint: "", details: "" },
    magicblock: { status: "pending", details: "" },
    database: { status: "pending", details: "" },
    env: { status: "OK", missing: [] as string[] }
  };

  // 1. Check Environment Variables
  const requiredEnv = [
    "NEXT_PUBLIC_RPC_URL",
    "MAGICBLOCK_API_ENDPOINT",
    "CLOAK_PRIVATE_PAYMENT_SIGNER_KEY"
  ];
  requiredEnv.forEach(env => {
    if (!process.env[env]) results.env.missing.push(env);
  });
  if (results.env.missing.length > 0) results.env.status = "Incomplete";

  // 2. Check RPC Fast Connectivity
  try {
    const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://api.devnet.solana.com";
    results.rpc.endpoint = rpcUrl.split('?')[0];
    const connection = new Connection(rpcUrl, "confirmed");
    const { blockhash } = await connection.getLatestBlockhash();
    results.rpc.status = "OK";
    results.rpc.details = `Connected. Blockhash: ${blockhash.substring(0, 8)}...`;
  } catch (error) {
    results.rpc.status = "Error";
    results.rpc.details = error instanceof Error ? error.message : String(error);
  }

  // 3. Check MagicBlock Integration
  try {
    const magicBlock = getMagicBlockService();
    const status = await magicBlock.verifyExecutionLayerStatus();
    results.magicblock.status = "OK";
    results.magicblock.details = `Execution Layer: ${status.status} (${status.environment})`;
  } catch (error) {
    results.magicblock.status = "Error";
    results.magicblock.details = error instanceof Error ? error.message : String(error);
  }

  // 4. Check Database (JSON-DB)
  try {
    const db = await jsonDb.getState();
    results.database.status = "OK";
    results.database.details = `JSON-DB Accessible. Records: ${db.subscriptions.length + db.subscriptionEvents.length}`;
  } catch (error) {
    results.database.status = "Error";
    results.database.details = error instanceof Error ? error.message : String(error);
  }

  const overallStatus = 
    results.rpc.status === "OK" && 
    results.magicblock.status === "OK" && 
    results.database.status === "OK" 
      ? 200 : 503;

  return NextResponse.json(results, { status: overallStatus });
}
