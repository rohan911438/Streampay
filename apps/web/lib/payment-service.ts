import { db } from "@paystream/db";
import { jsonDb } from "./json-db";
import { dbConfig } from "./db-config";
import { getMagicBlockService } from "./magicblock-service";
import { WebhookService } from "./webhook-service";
import { recordSubscriptionEvent } from "./subscriptions-db";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

export interface PaymentRequest {
  merchantId: string;
  customerWallet: string;
  amount: number;
  planId?: string;
  type: "private" | "public";
  senderPrivateKey?: string; 
  customerEmail?: string;
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

    try {
      // 1. Resolve Plan (if not provided, get default)
      let resolvedPlanId = planId;
      if (!resolvedPlanId) {
        if (dbConfig.shouldTryPostgres()) {
          try {
            const planResult = await db.query("SELECT id FROM plans WHERE is_active = true ORDER BY created_at ASC LIMIT 1");
            resolvedPlanId = planResult.rows[0]?.id;
          } catch (err) {
            // Silence Postgres error
          }
        }
        if (!resolvedPlanId) {
          const plans = await jsonDb.listPlans();
          resolvedPlanId = plans.find(p => p.active)?.id || plans[0]?.id;
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
        } catch (err: any) {
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
      }

      // 3. Execution (Cloak + MagicBlock)
      const signerKeyBase64 = senderPrivateKey?.trim() || process.env.CLOAK_PRIVATE_PAYMENT_SIGNER_KEY?.trim();
      let txResult: string | undefined;
      let magicBlockRef = "SIMULATED-REF";

      if (signerKeyBase64 && type === "private") {
        try {
          const magicBlock = getMagicBlockService();
          // Decode from base64 or base58 depending on what's provided
          let signerKey: Uint8Array;
          try {
            signerKey = bs58.decode(signerKeyBase64);
          } catch {
            signerKey = new Uint8Array(Buffer.from(signerKeyBase64, 'base64'));
          }
          
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
        } catch (err) {
          console.error("[PaymentService] Execution failed:", err);
          await this.updatePaymentStatus(payment.id, "failed");
          return { success: false, error: "Payment execution failed", message: String(err) };
        }
      } else {
        console.warn("[PaymentService] Simulation mode or public transfer. Completing automatically.");
      }

      // 4. Update Success Status
      await this.updatePaymentStatus(payment.id, "completed", {
        transaction_reference: txResult || "SIMULATED-" + Math.random().toString(36).substring(7),
        provider_payment_id: magicBlockRef
      });

      // 5. Record Event for Dashboard
      await recordSubscriptionEvent({
        userId: customerWallet, // We use wallet as fallback ID in JSON DB
        amountUsdc: Number(amount),
        eventType: "payment_success",
        provider: "cloak",
        executionLayer: "magicblock",
        providerEventId: txResult || magicBlockRef,
        payload: { merchant_id: merchantId, magicBlockRef }
      });

      // 6. Notify Merchant via Webhook
      await WebhookService.notifyPaymentCompleted(merchantId, {
        id: payment.id,
        status: "completed",
        transaction_reference: txResult || magicBlockRef,
        amount_usdc: amount,
        currency: "USDC"
      });

      return {
        success: true,
        paymentId: payment.id,
        transactionSignature: txResult,
        transactionReference: magicBlockRef,
        message: "Payment processed successfully"
      };

    } catch (err) {
      console.error("[PaymentService] Unexpected error:", err);
      return { success: false, error: "Internal server error", message: String(err) };
    }
  },

  async updatePaymentStatus(id: string, status: string, updates: any = {}) {
    if (dbConfig.shouldTryPostgres()) {
      try {
        await db.update("payments", { status, ...updates }, "id = $1", [id]);
        return;
      } catch (err) {
        // Silence or handle
      }
    }
    await jsonDb.updatePaymentStatus(id, status as any);
  }
};
