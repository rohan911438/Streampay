import { db } from "@paystream/db";
import { jsonDb } from "./json-db";
import { dbConfig } from "./db-config";

export interface WebhookNotification {
  payment_id: string;
  status: string;
  transaction_reference: string | null;
  amount: number;
  currency: string;
  timestamp: string;
}

export const WebhookService = {
  /**
   * Sends a webhook notification to the merchant's configured URL
   */
  async notifyMerchant(merchantId: string, eventType: string, payload: WebhookNotification) {
    try {
      // 1. Get the merchant's webhook URL
      let webhookUrl: string | undefined;
      
      if (dbConfig.shouldTryPostgres()) {
        try {
          const merchant = await db.query(
            "SELECT webhook_url FROM merchants WHERE id = $1",
            [merchantId]
          );
          webhookUrl = merchant.rows[0]?.webhook_url;
        } catch (dbErr: any) {
          if (dbErr.code === 'ECONNREFUSED' || dbErr.message?.includes('ECONNREFUSED')) {
            dbConfig.markPostgresAsUnavailable();
          } else {
            console.error("[WebhookService] SQL lookup failed:", dbErr);
          }
        }
      }

      // If Postgres lookup skipped or failed, try JSON DB
      if (webhookUrl === undefined) {
        const merchant = await jsonDb.findMerchantById(merchantId);
        webhookUrl = merchant?.webhook_url;
      }

      if (!webhookUrl) {
        console.log(`[WebhookService] No webhook URL configured for merchant ${merchantId}. Skipping.`);
        return;
      }

      console.log(`[WebhookService] Sending ${eventType} notification to ${webhookUrl}`);

      // 2. Send the POST request
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-StreamPay-Event": eventType,
          "X-StreamPay-Timestamp": new Date().toISOString(),
        },
        body: JSON.stringify({
          event: eventType,
          data: payload,
        }),
      });

      if (!response.ok) {
        console.error(`[WebhookService] Failed to send webhook to ${webhookUrl}: ${response.statusText}`);
      } else {
        console.log(`[WebhookService] Webhook sent successfully to ${webhookUrl}`);
      }
    } catch (err) {
      console.error(`[WebhookService] Error sending webhook for merchant ${merchantId}:`, err);
    }
  },

  /**
   * Helper to notify on payment completion
   */
  async notifyPaymentCompleted(merchantId: string, payment: {
    id: string;
    status: string;
    transaction_reference: string | null;
    amount_usdc: number | string;
    currency?: string;
  }) {
    return this.notifyMerchant(merchantId, "payment.completed", {
      payment_id: payment.id,
      status: payment.status,
      transaction_reference: payment.transaction_reference,
      amount: Number(payment.amount_usdc),
      currency: payment.currency || "USDC",
      timestamp: new Date().toISOString(),
    });
  }
};
