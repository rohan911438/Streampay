/**
 * Test/Demo Script for Real Transaction Signing Flow
 * 
 * This script demonstrates how to use the transaction signing flow
 * from the frontend. It can be used in the browser console or in tests.
 * 
 * Usage in browser console:
 * 1. Open developer console (F12)
 * 2. Copy and paste this script
 * 3. Call the functions
 * 
 * Example:
 * testTransactionSigningFlow();
 */

// ============================================================================
// Test 1: Prepare Transaction
// ============================================================================
async function testPrepareTransaction() {
  console.log("🧪 [TEST] Testing transaction preparation...");
  
  try {
    const response = await fetch("/api/payment/prepare", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress: "11111111111111111111111111111112", // Example address
        amount: 10,
        planId: "test-plan",
        type: "private"
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Failed to prepare transaction:", data);
      return null;
    }

    console.log("✅ Transaction prepared successfully");
    console.log("📋 Response:", data);
    console.log("💾 Payment ID:", data.paymentId);
    console.log("📦 Transaction size:", data.transaction.length, "bytes (base64)");
    
    return data;
  } catch (error) {
    console.error("❌ Error preparing transaction:", error);
    return null;
  }
}

// ============================================================================
// Test 2: Decode Transaction
// ============================================================================
async function testDecodeTransaction(prepareResponse) {
  console.log("\n🧪 [TEST] Testing transaction decoding...");
  
  if (!prepareResponse) {
    console.error("❌ No prepared transaction. Run testPrepareTransaction first.");
    return;
  }

  try {
    const { Transaction } = await import("@solana/web3.js");
    
    const transactionBuffer = Buffer.from(prepareResponse.transaction, "base64");
    const transaction = Transaction.from(transactionBuffer);
    
    console.log("✅ Transaction decoded successfully");
    console.log("📋 Transaction details:");
    console.log("   - Fee payer:", transaction.feePayer?.toString());
    console.log("   - Recent blockhash:", transaction.recentBlockhash);
    console.log("   - Instructions count:", transaction.instructions.length);
    console.log("   - Signers required:", transaction.signatures.length);
    
    return transaction;
  } catch (error) {
    console.error("❌ Error decoding transaction:", error);
    return null;
  }
}

// ============================================================================
// Test 3: Check Transaction Status
// ============================================================================
async function testCheckTransactionStatus(signature) {
  console.log("\n🧪 [TEST] Testing transaction status check...");
  
  if (!signature) {
    console.error("❌ No transaction signature provided");
    return;
  }

  try {
    const response = await fetch(
      `/api/payment/status?signature=${encodeURIComponent(signature)}`
    );

    const data = await response.json();
    
    console.log("✅ Transaction status retrieved");
    console.log("📋 Status details:");
    console.log("   - Signature:", data.signature);
    console.log("   - Confirmed:", data.confirmed);
    console.log("   - Status:", data.status);
    console.log("   - Confirmations:", data.confirmations);
    
    if (data.error) {
      console.log("   - Error:", data.error);
    }
    
    return data;
  } catch (error) {
    console.error("❌ Error checking transaction status:", error);
    return null;
  }
}

// ============================================================================
// Test 4: Complete Flow (without actual wallet signing)
// ============================================================================
async function testCompleteFlowMockWallet() {
  console.log("\n🧪 [TEST] Testing complete flow (mock wallet)...");
  
  try {
    // Step 1: Prepare transaction
    console.log("\n📝 Step 1: Preparing transaction...");
    const prepareResponse = await testPrepareTransaction();
    if (!prepareResponse) return;

    // Step 2: Decode transaction
    console.log("\n📝 Step 2: Decoding transaction...");
    const transaction = await testDecodeTransaction(prepareResponse);
    if (!transaction) return;

    // Step 3: Mock signing (in real scenario, wallet would sign)
    console.log("\n📝 Step 3: Mock signing transaction...");
    console.log("   ⚠️  In real scenario, wallet adapter would open here");
    console.log("   ✅ Mock: Transaction marked as signed");
    
    // Step 4: In real scenario, would submit signed transaction
    console.log("\n📝 Step 4: Would submit signed transaction...");
    console.log("   ⚠️  Skipping actual submission in mock mode");
    
    console.log("\n✅ Complete flow test finished!");
  } catch (error) {
    console.error("❌ Error in complete flow test:", error);
  }
}

// ============================================================================
// Test 5: Check Wallet Connection
// ============================================================================
async function testWalletConnection() {
  console.log("\n🧪 [TEST] Testing wallet connection...");
  
  try {
    // This assumes the payment component is loaded
    // In real scenario, check if wallet context exists
    
    console.log("✅ Wallet connection test:");
    console.log("   - Check if Phantom is installed: window.solana?.isPhantom");
    console.log("   - Current connected wallet:", window.solana?.isConnected);
    console.log("   - Public key:", window.solana?.publicKey?.toString());
    
    // Try to get wallet context from component
    if (window.__paymentContext) {
      console.log("   - Component wallet connected:", window.__paymentContext.connected);
      console.log("   - Component wallet address:", window.__paymentContext.publicKey?.toString());
    } else {
      console.log("   - Payment component context not found");
    }
  } catch (error) {
    console.error("❌ Error checking wallet connection:", error);
  }
}

// ============================================================================
// Test 6: End-to-End Transaction Flow (requires real wallet)
// ============================================================================
async function testE2ETransactionFlow(walletAddress, amount = 10) {
  console.log("\n🧪 [TEST] Testing E2E transaction flow...");
  console.log("📋 Parameters: walletAddress =", walletAddress, ", amount =", amount);
  
  try {
    const { executePaymentWithWalletSignature, TransactionError } = 
      await import("/lib/transaction-signing.ts");
    
    // Note: This would require the wallet context to be available
    // In real usage, the wallet context comes from the React component
    
    console.log("⚠️  E2E test would require active wallet context from component");
    console.log("✅ Use testTransactionSigningFlow() instead for component-based testing");
    
  } catch (error) {
    console.error("❌ Error in E2E test:", error);
  }
}

// ============================================================================
// Test 7: Network Status Check
// ============================================================================
async function testNetworkStatus() {
  console.log("\n🧪 [TEST] Testing network status...");
  
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
    
    console.log("📡 Network status:");
    console.log("   - RPC Endpoint:", rpcUrl);
    
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth"
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log("   ✅ RPC is healthy");
    } else {
      console.log("   ❌ RPC health check failed:", data);
    }
    
  } catch (error) {
    console.error("❌ Error checking network status:", error);
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function testTransactionSigningFlow() {
  console.clear();
  console.log("=".repeat(80));
  console.log("🚀 REAL TRANSACTION SIGNING FLOW - TEST SUITE");
  console.log("=".repeat(80));
  console.log("\nStarting test suite...\n");

  // Test 1: Network
  await testNetworkStatus();

  // Test 2: Prepare transaction
  const prepareResponse = await testPrepareTransaction();

  // Test 3: Decode transaction
  if (prepareResponse) {
    await testDecodeTransaction(prepareResponse);
  }

  // Test 4: Check wallet
  await testWalletConnection();

  // Test 5: Complete mock flow
  // await testCompleteFlowMockWallet();

  console.log("\n" + "=".repeat(80));
  console.log("✅ Test suite completed!");
  console.log("=".repeat(80));
  console.log("\nNext steps:");
  console.log("1. Connect your wallet in the UI");
  console.log("2. Click 'Private Pay' button");
  console.log("3. Sign the transaction in your wallet");
  console.log("4. Wait for on-chain confirmation");
}

// ============================================================================
// Helper: Monitor Transaction Confirmation
// ============================================================================
async function monitorTransactionConfirmation(signature, intervalSeconds = 2, maxAttempts = 30) {
  console.log("\n⏱️  Monitoring transaction confirmation...");
  console.log("📊 Signature:", signature);
  
  let attempts = 0;
  
  const interval = setInterval(async () => {
    attempts++;
    
    try {
      const status = await testCheckTransactionStatus(signature);
      
      if (status.confirmed) {
        console.log("\n✅ TRANSACTION CONFIRMED!");
        console.log("🎉 Status:", status.confirmationStatus);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.log("\n⏰ Maximum attempts reached. Stopping monitor.");
        clearInterval(interval);
      } else {
        console.log(`⏳ Attempt ${attempts}/${maxAttempts}: Status = ${status.status}`);
      }
    } catch (error) {
      console.error("❌ Error checking status:", error);
    }
  }, intervalSeconds * 1000);
}

// ============================================================================
// Export for use in console
// ============================================================================
if (typeof window !== 'undefined') {
  window.testTransactionSigningFlow = testTransactionSigningFlow;
  window.testPrepareTransaction = testPrepareTransaction;
  window.testCheckTransactionStatus = testCheckTransactionStatus;
  window.monitorTransactionConfirmation = monitorTransactionConfirmation;
  
  console.log("✅ Test functions loaded. Available functions:");
  console.log("  - testTransactionSigningFlow() - Run full test suite");
  console.log("  - testPrepareTransaction() - Test transaction preparation");
  console.log("  - testCheckTransactionStatus(signature) - Check tx status");
  console.log("  - monitorTransactionConfirmation(signature) - Monitor confirmation");
}
