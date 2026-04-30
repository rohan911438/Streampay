import { NextResponse } from 'next/server';
import { LiFiService } from '@/lib/cross-chain-service';

/**
 * API route to fetch cross-chain routes from LI.FI
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromChain, fromToken, fromAmount, toChain, toToken, fromAddress } = body;

    // Validate parameters
    if (!fromChain || !fromToken || !fromAmount || !toChain || !toToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromChain, fromToken, fromAmount, toChain, toToken' },
        { status: 400 }
      );
    }

    // Fetch the best route from LI.FI
    const route = await LiFiService.getBestRoute({
      fromChain,
      fromToken,
      fromAmount,
      toChain,
      toToken,
      fromAddress,
    });

    return NextResponse.json(route);
  } catch (error: any) {
    console.error('[API/Cross-Chain] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.stack
      },
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
    service: 'StreamPay Cross-Chain Routing',
    provider: 'LI.FI'
  });
}
