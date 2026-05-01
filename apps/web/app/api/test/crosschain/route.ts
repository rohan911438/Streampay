import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG = true;

// Helper for debugging
function logDebug(title: string, data?: any) {
  if (DEBUG) {
    console.group(`\n🟣 [CROSS-CHAIN DEBUG] ${title}`);
    if (data) {
      console.dir(data, { depth: null, colors: true });
    }
    console.groupEnd();
  }
}

export async function GET() {
  try {
    logDebug("Starting Cross-Chain Pipeline Test");

    const steps = {
      lifi: "pending",
      jupiter_quote: "pending",
      jupiter_swap: "pending",
    };

    const details: any = {};

    // ---------------------------------------------------------
    // PART 2: LI.FI ROUTE TEST
    // ---------------------------------------------------------
    logDebug("Step 1: Requesting LI.FI Route (ETH -> SOL)");
    
    // Testing with 1 USDC on Ethereum to Solana
    const lifiParams = new URLSearchParams({
      fromChain: "1", // Ethereum
      toChain: "1151111081099710", // Solana
      fromToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on ETH
      toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on SOL
      fromAmount: "1000000", // 1 USDC (6 decimals)
      fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Dummy ETH address
      toAddress: "11111111111111111111111111111112", // Dummy SOL address
    });

    let lifiRoute: any = null;
    try {
      const lifiResponse = await fetch(`https://li.quest/v1/quote?${lifiParams}`);
      const lifiData = await lifiResponse.json();
      
      logDebug("LI.FI API Response", lifiData);

      if (!lifiResponse.ok) {
        throw new Error(lifiData.message || "Failed to fetch LI.FI route");
      }

      if (!lifiData || !lifiData.estimate) {
        throw new Error("No route found from LI.FI");
      }

      lifiRoute = lifiData;
      steps.lifi = "ok";
      details.lifi = {
        estimatedOutput: lifiRoute.estimate.toAmount,
        executionDuration: lifiRoute.estimate.executionDuration,
      };
      
      logDebug("LI.FI Route Found", details.lifi);
    } catch (error: any) {
      logDebug("LI.FI Error", error.message);
      return NextResponse.json({
        status: "error",
        message: "LI.FI Route Test Failed",
        error: error.message,
        steps,
        fix_strategy: [
          "Try a different token (e.g., ETH instead of USDC)",
          "Reduce the amount",
          "Check if chain IDs are correct",
        ]
      }, { status: 500 });
    }

    // ---------------------------------------------------------
    // PART 3: JUPITER QUOTE TEST
    // ---------------------------------------------------------
    logDebug("Step 2: Requesting Jupiter Quote (USDC -> SOL)");

    // The output from LI.FI bridge will be USDC on Solana. We want to swap it to SOL.
    // Using 1 USDC for the test swap
    const jupiterQuoteParams = new URLSearchParams({
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
      outputMint: "So11111111111111111111111111111111111111112", // WSOL
      amount: "1000000", // 1 USDC
      slippageBps: "50",
    });

    let jupiterQuote: any = null;
    try {
      const quoteResponse = await fetch(`https://api.jup.ag/swap/v1/quote?${jupiterQuoteParams}`);
      const quoteData = await quoteResponse.json();

      logDebug("Jupiter Quote API Response", quoteData);

      if (!quoteResponse.ok) {
        throw new Error(quoteData.error || "Failed to fetch Jupiter quote");
      }

      if (!quoteData || !quoteData.outAmount || Number(quoteData.outAmount) <= 0) {
        throw new Error("Invalid quote received from Jupiter");
      }

      jupiterQuote = quoteData;
      steps.jupiter_quote = "ok";
      details.jupiter_quote = {
        outAmount: quoteData.outAmount,
        priceImpactPct: quoteData.priceImpactPct,
      };

      logDebug("Jupiter Quote Successful", details.jupiter_quote);
    } catch (error: any) {
      logDebug("Jupiter Quote Error", error.message);
      return NextResponse.json({
        status: "error",
        message: "Jupiter Quote Test Failed",
        error: error.message,
        steps,
        fix_strategy: [
          "Check input and output mint addresses",
          "Ensure amount is large enough to cover fees",
          "Check decimals configuration",
        ]
      }, { status: 500 });
    }

    // ---------------------------------------------------------
    // PART 4: JUPITER SWAP TX TEST
    // ---------------------------------------------------------
    logDebug("Step 3: Generating Jupiter Swap Transaction");

    try {
      const swapResponse = await fetch('https://api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: jupiterQuote,
          userPublicKey: "11111111111111111111111111111112", // Dummy system program public key
          wrapAndUnwrapSol: true,
        })
      });
      
      const swapData = await swapResponse.json();
      
      logDebug("Jupiter Swap API Response", swapData);

      if (!swapResponse.ok) {
        throw new Error(swapData.error || "Failed to generate Jupiter swap transaction");
      }

      if (!swapData.swapTransaction || swapData.swapTransaction.length === 0) {
        throw new Error("Jupiter returned empty swap transaction");
      }

      steps.jupiter_swap = "ok";
      details.jupiter_swap = {
        transactionLength: swapData.swapTransaction.length,
        hasTransaction: true,
      };

      logDebug("Jupiter Swap Transaction Generated", details.jupiter_swap);
    } catch (error: any) {
      logDebug("Jupiter Swap Error", error.message);
      return NextResponse.json({
        status: "error",
        message: "Jupiter Swap TX Test Failed",
        error: error.message,
        steps,
        fix_strategy: [
          "Verify the quote response passed correctly",
          "Verify userPublicKey is valid",
          "Check Jupiter API response format",
        ]
      }, { status: 500 });
    }

    // ---------------------------------------------------------
    // PART 5: COMBINED FLOW TEST RESULT
    // ---------------------------------------------------------
    logDebug("Pipeline Validation Complete!");

    return NextResponse.json({
      status: "success",
      pipeline: "validated",
      steps,
      details,
    }, { status: 200 });

  } catch (error: any) {
    logDebug("Unexpected Global Error", error);
    return NextResponse.json({
      status: "error",
      message: "Unexpected test failure",
      error: error.message,
    }, { status: 500 });
  }
}
