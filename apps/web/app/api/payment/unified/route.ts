import { NextResponse } from 'next/server';
import { PaymentService } from '@/lib/payment-service';

/**
 * Unified Payment Flow API
 * 
 * Handles cross-chain bridging (LI.FI), Solana swaps (Jupiter), 
 * and private execution (Cloak + MagicBlock) in a single pipeline.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      merchantId, 
      customerWallet, 
      amount, 
      planId, 
      sourceChain, 
      sourceToken,
      customerEmail 
    } = body;

    // Validate required fields
    if (!customerWallet || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: customerWallet, amount' },
        { status: 400 }
      );
    }

    // Default to demo merchant if none provided
    const targetMerchantId = merchantId || "00000000-0000-0000-0000-000000000000";

    console.log(`[API/Unified] Processing unified flow for wallet ${customerWallet}`);

    // Call the unified payment flow in PaymentService
    const result = await PaymentService.processCrossChainPayment({
      merchantId: targetMerchantId,
      customerWallet,
      amount,
      planId,
      type: "private",
      sourceChain: sourceChain || "1", // Default to Ethereum
      sourceToken: sourceToken || "USDC",
      customerEmail
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API/Unified] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET handler for simple connectivity check
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    service: 'StreamPay Unified Payment Pipeline',
    capabilities: ['Cross-Chain', 'Jupiter Swap', 'Cloak Privacy']
  });
}
