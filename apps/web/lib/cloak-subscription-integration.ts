/**
 * Example: Using Cloak for Private Subscription Payments
 * 
 * This example demonstrates how to integrate Cloak private transfers
 * into the StreamPay subscription payment flow.
 */

import { getCloakService } from "@paystream/solana";
import { db } from "@paystream/db";
import { getMagicBlockService } from "./magicblock-service";
import { keypairFromSecretKeyInput, normalizeSecretKeyInput } from "./secret-key-utils";

/**
 * Process a private subscription payment
 * 
 * Call this function when a subscription renewal is due
 */
export async function processPrivateSubscriptionPayment({
  userId,
  subscriptionId,
  senderPrivateKey,
  merchantWalletAddress,
  plan,
}: {
  userId: string;
  subscriptionId: string;
  senderPrivateKey: string | Uint8Array;
  merchantWalletAddress: string;
  plan: {
    id: string;
    name: string;
    priceUsdc: number;
  };
}) {
  const magicBlockService = getMagicBlockService();

  try {
    const normalizedSecretKey = normalizeSecretKeyInput(senderPrivateKey);

    // 1. Execute private transfer via MagicBlock execution layer
    console.log(`[Subscription] Processing optimized payment for ${plan.name}...`);

    const transferResult = await magicBlockService.processAndRoutePrivatePayment(
      normalizedSecretKey,
      merchantWalletAddress,
      plan.priceUsdc,
      {
        description: `Subscription renewal: ${plan.name}`,
        invoiceId: subscriptionId,
        orderId: `SUB-${subscriptionId}`,
      }
    );

    console.log(`[Subscription] MagicBlock routing successful. Ref: ${transferResult.magicBlockReference}`);

    console.log(`[Subscription] Transfer executed: ${transferResult.transactionSignature}`);

    // 2. Get sender public key for reference
    const senderKeypair = keypairFromSecretKeyInput(normalizedSecretKey);
    const senderAddress = senderKeypair.publicKey.toString();

    // 3. Store transaction record
    const transactionRecord = await db.insert(
      "private_transactions",
      {
        user_id: userId,
        subscription_id: subscriptionId,
        sender_address: senderAddress,
        recipient_address: merchantWalletAddress,
        amount_usdc: plan.priceUsdc,
        transaction_signature: transferResult.transactionSignature,
        transaction_reference: transferResult.transactionReference,
        status: transferResult.status,
        confirmation_status: "processing",
        metadata: JSON.stringify({
          description: `Subscription renewal: ${plan.name}`,
          invoiceId: subscriptionId,
          planId: plan.id,
          magicBlockRef: transferResult.magicBlockReference,
        }),
        execution_layer: "magicblock",
        created_at: new Date(),
        updated_at: new Date(),
      },
      "*"
    );

    if (!transactionRecord?.id) {
      throw new Error("Failed to store transaction record");
    }

    console.log(
      `[Subscription] Transaction stored in database: ${transactionRecord.id}`
    );

    // 4. Record subscription event
    await db.insert(
      "subscription_events",
      {
        user_id: userId,
        subscription_id: subscriptionId,
        amount_usdc: plan.priceUsdc,
        event_type: "payment_success",
        provider_event_id: transferResult.transactionSignature,
        payload: JSON.stringify({
          method: "cloak_private_transfer",
          transactionSignature: transferResult.transactionSignature,
          transactionReference: transferResult.transactionReference,
        }),
        occurred_at: new Date(),
        created_at: new Date(),
      },
      "*"
    );

    console.log(`[Subscription] Event recorded for subscription`);

    // 5. Update subscription next billing date
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    await db.update(
      "subscriptions",
      {
        status: "active",
        next_billing_date: nextBillingDate,
        updated_at: new Date(),
      },
      "id = $1",
      [subscriptionId],
      "*"
    );

    console.log(`[Subscription] Next billing date updated to ${nextBillingDate}`);

    return {
      success: true,
      transactionId: transactionRecord.id,
      transactionSignature: transferResult.transactionSignature,
      status: transferResult.status,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Subscription] Payment failed: ${errorMessage}`);

    // Record failed payment event
    await db.insert(
      "subscription_events",
      {
        user_id: userId,
        subscription_id: subscriptionId,
        amount_usdc: plan.priceUsdc,
        event_type: "payment_failed",
        payload: JSON.stringify({
          method: "cloak_private_transfer",
          error: errorMessage,
        }),
        occurred_at: new Date(),
        created_at: new Date(),
      },
      "*"
    );

    throw new Error(`Subscription payment failed: ${errorMessage}`);
  }
}

/**
 * Monitor and confirm pending private subscription payments
 * 
 * Run this periodically to check on pending transactions
 */
export async function confirmPendingSubscriptionPayments() {
  const cloakService = getCloakService();

  try {
    // Find pending transactions created more than 2 minutes ago
    const result = await db.query(
      `SELECT * FROM private_transactions 
       WHERE status = 'pending' 
       AND subscription_id IS NOT NULL
       AND created_at < NOW() - INTERVAL '2 minutes'
       ORDER BY created_at ASC
       LIMIT 10`
    );

    const pendingTx = result.rows;
    console.log(
      `[Subscription Confirmation] Found ${pendingTx.length} pending transactions`
    );

    for (const tx of pendingTx) {
      try {
        const status = await cloakService.getTransactionStatus(
          tx.transaction_signature
        );

        if (status.confirmed) {
          // Update transaction status
          await db.update(
            "private_transactions",
            {
              status: "confirmed",
              confirmation_status: "confirmed",
              confirmations: status.confirmations,
              slot: status.slot,
              confirmed_at: new Date(),
              updated_at: new Date(),
            },
            "id = $1",
            [tx.id],
            "*"
          );

          console.log(
            `[Subscription Confirmation] Confirmed: ${tx.id} (${status.confirmations} confirmations)`
          );
        } else {
          console.log(
            `[Subscription Confirmation] Still processing: ${tx.id}`
          );
        }
      } catch (error) {
        console.warn(
          `[Subscription Confirmation] Failed to check status for ${tx.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "[Subscription Confirmation] Error during confirmation check:",
      error
    );
  }
}

/**
 * Generate subscription payment report for audit
 */
export async function generateSubscriptionPaymentReport({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const result = await db.query(
    `SELECT 
      DATE(pt.created_at) as payment_date,
      COUNT(*) as transaction_count,
      SUM(pt.amount_usdc) as total_amount,
      COUNT(CASE WHEN pt.status = 'confirmed' THEN 1 END) as confirmed_count,
      COUNT(CASE WHEN pt.status = 'failed' THEN 1 END) as failed_count,
      COUNT(CASE WHEN pt.status = 'pending' THEN 1 END) as pending_count
    FROM private_transactions pt
    WHERE pt.subscription_id IS NOT NULL
    AND pt.created_at >= $1
    AND pt.created_at < $2
    GROUP BY DATE(pt.created_at)
    ORDER BY payment_date DESC`,
    [startDate, endDate]
  );

  return {
    period: { start: startDate, end: endDate },
    dailyStats: result.rows,
    totalAmount: result.rows.reduce(
      (sum, row) => sum + (parseFloat(row.total_amount) || 0),
      0
    ),
    totalTransactions: result.rows.reduce(
      (sum, row) => sum + row.transaction_count,
      0
    ),
  };
}

/**
 * API endpoint example: Process subscription payment
 * 
 * POST /api/subscriptions/process-payment
 * Body: { subscriptionId, userPrivateKey }
 */
export async function handleSubscriptionPaymentRequest(
  subscriptionId: string,
  userPrivateKey: string // Base64 encoded
) {
  try {
    // Get subscription details
    const subResult = await db.query(
      `SELECT s.*, p.price_usdc, p.name, u.wallet_address
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1`,
      [subscriptionId]
    );

    const subscription = subResult.rows[0];
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Process payment using private transfer
    const result = await processPrivateSubscriptionPayment({
      userId: subscription.user_id,
      subscriptionId,
      senderPrivateKey: userPrivateKey,
      merchantWalletAddress: process.env.MERCHANT_WALLET_ADDRESS!,
      plan: {
        id: subscription.plan_id,
        name: subscription.name,
        priceUsdc: subscription.price_usdc,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Background job: Process due subscriptions
 * 
 * Run this on a schedule (e.g., every hour) to process all due subscriptions
 */
export async function processDueSubscriptions() {
  console.log("[Background Job] Starting due subscription processor...");

  try {
    // Find active subscriptions with next_billing_date in the past
    const result = await db.query(
      `SELECT s.*, p.price_usdc, p.name, u.id as user_id, u.wallet_address
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'active'
       AND s.next_billing_date < NOW()
       LIMIT 5`
    );

    const dueSubscriptions = result.rows;
    console.log(`[Background Job] Found ${dueSubscriptions.length} due subscriptions`);

    for (const sub of dueSubscriptions) {
      try {
        console.log(
          `[Background Job] Processing subscription ${sub.id} for user ${sub.user_id}`
        );

        // Note: In production, you would:
        // 1. Fetch user's private key from secure storage
        // 2. Call processPrivateSubscriptionPayment
        // 3. Handle failures with retry logic

        console.log(`[Background Job] ✓ Successfully processed ${sub.id}`);
      } catch (error) {
        console.error(
          `[Background Job] ✗ Failed to process subscription ${sub.id}:`,
          error
        );

        // Mark subscription as requiring manual attention
        await db.update(
          "subscriptions",
          {
            status: "pending", // Changed from active to pending for manual review
            updated_at: new Date(),
          },
          "id = $1",
          [sub.id],
          "*"
        );
      }
    }

    console.log("[Background Job] Due subscription processor completed");
  } catch (error) {
    console.error("[Background Job] Error in processor:", error);
  }
}

// Export for use in scheduled jobs or webhooks
export default {
  processPrivateSubscriptionPayment,
  confirmPendingSubscriptionPayments,
  generateSubscriptionPaymentReport,
  handleSubscriptionPaymentRequest,
  processDueSubscriptions,
};
