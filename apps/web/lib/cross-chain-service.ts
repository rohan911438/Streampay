const LIFI_API_KEY = process.env.LIFI_API_KEY;
const LIFI_API_URL = process.env.LIFI_API_URL || 'https://li.quest/v1';
const JUPITER_API_URL = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';

export interface LiFiRouteRequest {
  fromChain: string;
  fromToken: string;
  fromAmount: string;
  toChain: string;
  toToken: string;
  fromAddress?: string;
}

/**
 * Service for cross-chain routing using LI.FI
 */
export const LiFiService = {
  async getBestRoute(params: LiFiRouteRequest) {
    const url = new URL(`${LIFI_API_URL}/routes`);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value.toString());
    });

    console.log(`[LiFiService] Fetching routes from chain ${params.fromChain} to ${params.toChain}`);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'x-lifi-api-key': LIFI_API_KEY || '',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[LiFiService] Route fetch failed:', errorData);
        throw new Error(errorData.message || 'Failed to fetch LI.FI routes');
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.warn('[LiFiService] No real routes found by LI.FI API.');
        throw new Error('No routes found');
      }

      // LI.FI sorts routes by efficiency/cost, so the first one is usually the best
      const bestRoute = data.routes[0];

      console.group('🚀 [LI.FI] Production Route Discovered');
      console.log('Route ID:', bestRoute.id);
      console.log('Bridge Tool:', bestRoute.steps[0].tool);
      console.log('Estimated Output:', bestRoute.toAmount);
      console.groupEnd();

      return {
        estimatedOutputAmount: bestRoute.toAmount,
        routeSteps: bestRoute.steps.map((step: any) => ({
          type: step.type,
          tool: step.tool,
          action: {
            fromChain: step.action.fromChainId,
            toChain: step.action.toChainId,
            fromToken: step.action.fromToken.symbol,
            toToken: step.action.toToken.symbol,
            fromAmount: step.action.fromAmount,
          },
          estimate: {
            fromAmount: step.estimate.fromAmount,
            toAmount: step.estimate.toAmount,
            executionDuration: step.estimate.executionDuration,
            feeCosts: step.estimate.feeCosts,
            gasCosts: step.estimate.gasCosts,
          },
        })),
        transactionData: bestRoute.transactionRequest || (bestRoute.steps[0].transactionRequest || null),
        fullRoute: bestRoute,
      };
    } catch (error) {
      console.error('[LiFiService] Error fetching production routes:', error);
      
      // Fallback simulated route for Demo/Hackathon reliability if production API is down
      const simulatedOutput = (Number(params.fromAmount) * 0.985).toFixed(0); // 1.5% slippage/fee simulation
      console.warn('[LiFiService] Returning simulated fallback route for stability.');
      
      return {
        estimatedOutputAmount: simulatedOutput,
        routeSteps: [
          {
            type: 'cross',
            tool: 'LI.FI Bridge (Simulated Fallback)',
            action: {
              fromChain: params.fromChain,
              toChain: params.toChain,
              fromToken: 'USDC',
              toToken: 'USDC',
              fromAmount: params.fromAmount,
            },
            estimate: {
              fromAmount: params.fromAmount,
              toAmount: simulatedOutput,
              executionDuration: 180,
              feeCosts: [{ amount: '2000000', symbol: 'USDC' }],
              gasCosts: [{ amount: '50000000000000', symbol: 'ETH' }],
            }
          }
        ],
        transactionData: null,
        fullRoute: { id: 'simulated-fallback-route', toAmount: simulatedOutput, steps: [] }
      };
    }
  }
};

/**
 * Service for Solana-native swaps using Jupiter
 */
export const JupiterService = {
  async getQuote(inputMint: string, outputMint: string, amount: string, slippageBps: number = 50) {
    const url = new URL(`${JUPITER_API_URL}/quote`);
    url.searchParams.append('inputMint', inputMint);
    url.searchParams.append('outputMint', outputMint);
    url.searchParams.append('amount', amount);
    url.searchParams.append('slippageBps', slippageBps.toString());

    console.log(`[JupiterService] Fetching quote for ${amount} units from ${inputMint} to ${outputMint}`);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'x-api-key': process.env.JUPITER_API_KEY || '',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[JupiterService] Quote fetch failed:', errorData);
        throw new Error(errorData.message || 'Failed to fetch Jupiter quote');
      }

      const data = await response.json();
      
      console.group('🪐 [Jupiter] Production Quote Received');
      console.log('Input Mint:', inputMint);
      console.log('Output Amount:', data.outAmount);
      console.log('Price Impact:', data.priceImpactPct);
      console.groupEnd();

      return data;
    } catch (error) {
      console.error('[JupiterService] Error fetching quote:', error);
      throw error;
    }
  },

  async getSwapTransaction(quoteResponse: any, userPublicKey: string) {
    console.log(`[JupiterService] Requesting swap transaction for ${userPublicKey}`);
    
    try {
      const response = await fetch(`${JUPITER_API_URL.replace('/v6', '')}/swap/v1/swap`, { // Note: swap is usually on v1
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.JUPITER_API_KEY || '',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[JupiterService] Swap transaction generation failed:', errorData);
        throw new Error(errorData.message || 'Failed to fetch Jupiter swap transaction');
      }

      const data = await response.json();
      console.log('[JupiterService] Swap transaction generated successfully');
      return data;
    } catch (error) {
      console.error('[JupiterService] Error generating swap transaction:', error);
      throw error;
    }
  }
};
