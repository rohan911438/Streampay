import { NextResponse } from 'next/server';
import { JupiterService } from '@/lib/cross-chain-service';

/**
 * API route to fetch Jupiter quotes and swap transactions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputMint, outputMint, amount, slippageBps, userPublicKey } = body;

    // Validate core parameters
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: inputMint, outputMint, amount' },
        { status: 400 }
      );
    }

    // Fetch quote from Jupiter
    const quote = await JupiterService.getQuote(
      inputMint, 
      outputMint, 
      amount, 
      slippageBps || 50
    );

    // If userPublicKey is provided, also fetch the swap transaction
    if (userPublicKey) {
      const swapResponse = await JupiterService.getSwapTransaction(quote, userPublicKey);
      return NextResponse.json({ 
        quote, 
        swapTransaction: swapResponse.swapTransaction,
        lastValidBlockHeight: swapResponse.lastValidBlockHeight
      });
    }

    return NextResponse.json({ quote });
  } catch (error: any) {
    console.error('[API/Swap] Error:', error);
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
    service: 'StreamPay Solana Swap',
    provider: 'Jupiter'
  });
}
