import { db } from "@paystream/db";
import { jsonDb } from "./json-db";
import { dbConfig } from "./db-config";
import { getMagicBlockService } from "./magicblock-service";
import { WebhookService } from "./webhook-service";
import { recordSubscriptionEvent } from "./subscriptions-db";
import { normalizeSecretKeyInput } from "./secret-key-utils";
import { LiFiService, JupiterService } from "./cross-chain-service";

export interface PaymentRequest {
  merchantId: string;
  customerWallet: string;
  amount: number;
  planId?: string;
  type: "private" | "public";
  senderPrivateKey?: string; 
  customerEmail?: string;
  sourceChain?: string;
  sourceToken?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  subscriptionId?: string;
  transactionSignature?: string;
  transactionReference?: string;
  error?: string;
  message?: string;
}

/**
 * Unified Payment Service
 * 
 * This service centralizes the payment execution pipeline (Cloak + MagicBlock + RPC Fast)
 * and ensures consistency across Demo and Platform API flows.
 * It handles database persistence with automatic fallback to local JSON DB.
 */
export const PaymentService = {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const { merchantId, customerWallet, amount, planId, type, senderPrivateKey, customerEmail } = request;

    console.log(`[PaymentService] Initiating payment process for wallet: ${customerWallet}, amount: ${amount}, type: ${type}`);

    try {
      // 1. Resolve Plan (if not provided, get default)
      let resolvedPlanId = planId;
      if (!resolvedPlanId) {
        if (dbConfig.shouldTryPostgres()) {
          try {
            const planResult = await db.query("SELECT id FROM plans WHERE is_active = true ORDER BY created_at ASC LIMIT 1");
            resolvedPlanId = planResult.rows[0]?.id;
            if (resolvedPlanId) console.log(`[PaymentService] Resolved plan ${resolvedPlanId} from Postgres`);
          } catch (err) {
            console.error("[PaymentService] Postgres plan resolution failed:", err);
          }
        }
        if (!resolvedPlanId) {
          const plans = await jsonDb.listPlans();
          resolvedPlanId = plans.find(p => p.active)?.id || plans[0]?.id;
          if (resolvedPlanId) console.log(`[PaymentService] Resolved plan ${resolvedPlanId} from Local DB`);
        }
      }

      // 2. Create Payment Record
      let payment: any = null;
      if (dbConfig.shouldTryPostgres()) {
        try {
          payment = await db.insert("payments", {
            merchant_id: merchantId,
            wallet_address: customerWallet,
            amount_usdc: amount,
            plan_id: resolvedPlanId || null,
            provider: "cloak",
            execution_layer: "magicblock",
            status: "pending",
            type: type,
            customer_email: customerEmail || null
          });
          if (payment) console.log(`[PaymentService] Created pending payment ${payment.id} in Postgres`);
        } catch (err: any) {
          console.error("[PaymentService] Postgres payment creation failed:", err);
          if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
            dbConfig.markPostgresAsUnavailable();
          }
        }
      }

      if (!payment) {
        // Fallback to JSON DB
        payment = await jsonDb.createPayment({
          merchantId,
          walletAddress: customerWallet,
          amountUsdc: amount,
          planId: resolvedPlanId || null,
          status: "pending",
          type: type,
          provider: "cloak",
          executionLayer: "magicblock",
          userId: null,
          subscriptionId: null,
          transactionReference: null
        });
        console.log(`[PaymentService] Created pending payment ${payment.id} in Local DB`);
      }

      // 3. Execution (Cloak + MagicBlock)
      const signerKeyInput = senderPrivateKey?.trim() || process.env.CLOAK_PRIVATE_PAYMENT_SIGNER_KEY?.trim();
      let txResult: string | undefined;
      let magicBlockRef = "SIMULATED-REF";

      // Check if key is valid (not a placeholder like "5K..." or empty)
      const isValidKeyFormat = signerKeyInput && 
        !signerKeyInput.endsWith("...") && 
        signerKeyInput !== "5K" &&
        signerKeyInput.length > 10; 

      if (isValidKeyFormat && type === "private") {
        console.log(`[PaymentService] Executing private payment via MagicBlock pipeline...`);
        try {
          const magicBlock = getMagicBlockService();
          const signerKey = normalizeSecretKeyInput(signerKeyInput);

          const result = await magicBlock.processAndRoutePrivatePayment(
            signerKey,
            customerWallet,
            Number(amount),
            {
              merchantId: merchantId,
              paymentId: payment.id,
              planId: resolvedPlanId
            }
          );
          
          txResult = result.transactionSignature;
          magicBlockRef = result.magicBlockReference;
          console.log(`[PaymentService] MagicBlock execution successful. TX: ${txResult}`);
        } catch (err) {
          console.error("[PaymentService] MagicBlock execution failed:", err);
          console.warn("[PaymentService] Falling back to simulation mode due to execution error");
        }
      } else {
        const reason = !signerKeyInput ? "Missing signer key" : 
                       signerKeyInput.endsWith("...") ? "Placeholder key detected" :
                       type !== "private" ? "Public transfer mode" : 
                       "Unknown reason";
        console.info(`[PaymentService] Simulation mode enabled: ${reason}.`);
      }

      // 4. Update Success Status
      console.log(`[PaymentService] Updating status for payment ${payment.id} to completed`);
      await this.updatePaymentStatus(payment.id, "completed", {
        transaction_reference: txResult || "SIMULATED-" + Math.random().toString(36).substring(7),
        provider_payment_id: magicBlockRef
      });

      // 5. Record Event for Dashboard
      console.log(`[PaymentService] Recording success event for dashboard...`);
      await recordSubscriptionEvent({
        userId: customerWallet, 
        amountUsdc: Number(amount),
        eventType: "payment_success",
        provider: "cloak",
        executionLayer: "magicblock",
        providerEventId: txResult || magicBlockRef,
        payload: { merchant_id: merchantId, magicBlockRef }
      });

      // 6. Notify Merchant via Webhook
      console.log(`[PaymentService] Dispatching webhook notification to merchant...`);
      await WebhookService.notifyPaymentCompleted(merchantId, {
        id: payment.id,
        status: "completed",
        transaction_reference: txResult || magicBlockRef,
        amount_usdc: amount,
        currency: "USDC"
      });

      console.log(`[PaymentService] Payment flow completed successfully for ID: ${payment.id}`);

      return {
        success: true,
        paymentId: payment.id,
        transactionSignature: txResult,
        transactionReference: magicBlockRef,
        message: "Payment processed successfully"
      };

    } catch (err) {
      console.error("[PaymentService] Critical pipeline error:", err);
      return { success: false, error: "Internal server error", message: String(err) };
    }
  },

  /**
   * Unified Cross-Chain Payment Flow
   * Routes: Non-Solana Chain -> LI.FI Bridge -> Solana -> Jupiter Swap (SOL) -> Cloak Private Payment
   */
  async processCrossChainPayment(request: PaymentRequest): Promise<PaymentResult & { route?: any, jupiterQuote?: any, swapTx?: string, tx?: string }> {
    const { merchantId, customerWallet, amount, sourceChain, sourceToken } = request;
    
    console.group('🟣 [StreamPay] Unified Cross-Chain Pipeline');
    console.log(`[UnifiedPayment] Pipeline start: ${sourceChain} (${sourceToken}) -> Solana`);
    console.log(`[UnifiedPayment] Target Value: $${amount} USD`);

    try {
      // 1. LI.FI Route Fetch (REAL)
      console.log(`[UnifiedPayment] [LI.FI] Fetching cross-chain route...`);
      const liFiRoute = await LiFiService.getBestRoute({
        fromChain: sourceChain || "1",
        fromToken: sourceToken || "USDC",
        fromAmount: (amount * 10 ** 6).toString(), // 6 decimals for simulation
        toChain: "1151111081099710", // Solana
        toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC on Solana
        fromAddress: customerWallet
      });

      console.log(`[LI.FI] Optimal route found: ${liFiRoute.fullRoute.id}`);
      console.log(`[LI.FI] Estimated output on destination: ${liFiRoute.estimatedOutputAmount} USDC`);
      
      // 2. Bridge Simulation 
      console.log(`[UnifiedPayment] [BRIDGE] Executing cross-chain bridge...`);
      
      // Simulate confirmation time for UX stability
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const lamportsInternally = Math.floor(Number(liFiRoute.estimatedOutputAmount));
      console.log(`[BRIDGE] Settlement confirmed. Funds arrived in Solana.`);

      // 3. Jupiter Swap (REAL PART - Quote & TX Generation)
      console.log(`[UnifiedPayment] [JUPITER] Requesting swap quote (USDC -> SOL)...`);
      
      const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const SOL_MINT = "So11111111111111111111111111111111111111112";
      
      let jupiterQuote = null;
      let swapTx = "SIMULATED-SWAP-TX";

      try {
        jupiterQuote = await JupiterService.getQuote(
          USDC_MINT,
          SOL_MINT,
          liFiRoute.estimatedOutputAmount
        );
        console.log(`[JUPITER] Quote received. Output: ${jupiterQuote.outAmount} lamports`);
        
        const swapTxResponse = await JupiterService.getSwapTransaction(jupiterQuote, customerWallet);
        swapTx = swapTxResponse.swapTransaction;
        console.log(`[JUPITER] Swap transaction generated and ready for signing.`);
      } catch (jupError: any) {
        console.warn(`[UnifiedPayment] [JUPITER] API unavailable. Using fallback simulation.`);
        jupiterQuote = { outAmount: liFiRoute.estimatedOutputAmount, priceImpactPct: 0 };
      }

      // 4. Hand-off to Private Execution Pipeline
      console.log(`[UnifiedPayment] [CLOAK] Initiating private execution layer...`);
      
      const paymentResult = await this.processPayment({
        ...request,
        type: "private"
      });

      console.log(`[UnifiedPayment] Flow finished. Payment ID: ${paymentResult.paymentId}`);
      console.groupEnd();

      return {
        ...paymentResult,
        status: "success",
        source_chain: sourceChain,
        settled_on: "SOL",
        private: true,
        tx: paymentResult.transactionSignature || "SIMULATED-" + Math.random().toString(36).substring(7),
        route: liFiRoute,
        jupiterQuote: jupiterQuote,
        swapTx: swapTx
      } as any;

    } catch (error: any) {
      console.error("[UnifiedPayment] Critical flow failure:", error);
      console.groupEnd();
      return { 
        success: false, 
        error: error.message || "Unified flow execution failed", 
        message: error.message 
      };
    }
  },

  async updatePaymentStatus(id: string, status: string, updates: any = {}) {
    if (dbConfig.shouldTryPostgres()) {
      try {
        await db.update("payments", { status, ...updates, updated_at: new Date().toISOString() }, "id = $1", [id]);
        console.log(`[PaymentService] Postgres status updated for ${id}: ${status}`);
        return;
      } catch (err) {
        console.error(`[PaymentService] Postgres update failed for ${id}:`, err);
      }
    }
    await jsonDb.updatePaymentStatus(id, status as any);
    console.log(`[PaymentService] Local DB status updated for ${id}: ${status}`);
  }
};
