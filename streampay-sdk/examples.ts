/**
 * StreamPay SDK - Example Usage
 * 
 * This file demonstrates common use cases and patterns for the StreamPay SDK.
 * 
 * Before running:
 * 1. npm install streampay-sdk
 * 2. Set environment variable: STREAMPAY_API_KEY=sp_live_...
 */

import { StreamPay, APIError } from "streampay-sdk";

// ============================================================================
// 1. INITIALIZATION
// ============================================================================

async function initializeSDK() {
  // Option 1: With API key only
  const sdk = new StreamPay("sp_live_abc123...");

  // Option 2: With full configuration
  const sdkFull = new StreamPay({
    apiKey: process.env.STREAMPAY_API_KEY!,
    baseUrl: "https://api.streampay.io",
    timeout: 30000,
    debug: true,
  });

  // Check API health
  const isHealthy = await sdkFull.health();
  console.log(`API Status: ${isHealthy ? "✓ Healthy" : "✗ Down"}`);

  return sdkFull;
}

// ============================================================================
// 2. PAYMENT EXAMPLES
// ============================================================================

async function exampleCreatePayment(sdk: StreamPay) {
  console.log("\n📝 Creating a payment...");

  try {
    const payment = await sdk.payments.create({
      amount: 1000, // $10.00 in cents
      currency: "USDC",
      recipient_id: "7qLn8gQUJfaRFMx2HaJe5aAMYm7MgKgsCp7PVKgBvfXY",
      privacy_mode: "cloak",
      source_chain: "solana",
      metadata: {
        orderId: "order_12345",
        customerId: "user_67890",
      },
    });

    console.log("✓ Payment created successfully!");
    console.log(`  ID: ${payment.id}`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Amount: $${payment.amount / 100} ${payment.currency}`);
    console.log(`  Transaction: ${payment.transaction_signature}`);

    return payment;
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`✗ Error: [${error.code}] ${error.message}`);
    } else {
      console.error("✗ Unexpected error:", error);
    }
    throw error;
  }
}

async function exampleCheckPaymentStatus(sdk: StreamPay, paymentId: string) {
  console.log("\n🔍 Checking payment status...");

  try {
    const payment = await sdk.payments.getStatus({
      payment_id: paymentId,
    });

    console.log(`✓ Payment found!`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Amount: $${payment.amount / 100}`);
    console.log(`  Created: ${new Date(payment.created_at * 1000).toISOString()}`);

    if (payment.status === "completed") {
      console.log(
        `  View on Solscan: https://solscan.io/tx/${payment.transaction_signature}`
      );
    }

    return payment;
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`✗ Payment not found: ${error.message}`);
    }
    throw error;
  }
}

async function exampleListPayments(sdk: StreamPay) {
  console.log("\n📋 Listing recent payments...");

  try {
    const result = await sdk.payments.list({
      limit: 10,
      page: 1,
      status: "completed",
      sort: "created_at:desc",
    });

    console.log(`✓ Found ${result.total} total payments`);
    console.log(`  This page: ${result.data.length}`);

    result.data.forEach((payment) => {
      console.log(
        `  - ${payment.id}: $${payment.amount / 100} ${payment.currency} (${
          payment.status
        })`
      );
    });

    if (result.has_more) {
      console.log(`  ... and more (has_more: true)`);
    }

    return result;
  } catch (error) {
    console.error("✗ Error listing payments:", error);
    throw error;
  }
}

async function exampleBatchPayments(sdk: StreamPay) {
  console.log("\n📦 Creating batch payments...");

  try {
    const result = await sdk.payments.createBatch({
      payments: [
        {
          amount: 1000,
          currency: "USDC",
          recipient_id: "user1_wallet",
          privacy_mode: "cloak",
          source_chain: "solana",
          metadata: { batchId: "batch_001" },
        },
        {
          amount: 2000,
          currency: "USDC",
          recipient_id: "user2_wallet",
          privacy_mode: "cloak",
          source_chain: "solana",
          metadata: { batchId: "batch_001" },
        },
        {
          amount: 1500,
          currency: "USDC",
          recipient_id: "user3_wallet",
          privacy_mode: "cloak",
          source_chain: "solana",
          metadata: { batchId: "batch_001" },
        },
      ],
      stop_on_error: false,
    });

    console.log(`✓ Batch processed!`);
    console.log(`  Successful: ${result.successful}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Total: $${result.total_amount / 100}`);

    if (result.failures.length > 0) {
      console.log("\n  Failures:");
      result.failures.forEach((failure) => {
        console.log(`    - ${failure.recipient_id}: ${failure.reason}`);
      });
    }

    return result;
  } catch (error) {
    console.error("✗ Error creating batch:", error);
    throw error;
  }
}

async function exampleRefundPayment(sdk: StreamPay, paymentId: string) {
  console.log("\n↩️  Refunding payment...");

  try {
    const refund = await sdk.payments.refund({
      payment_id: paymentId,
      reason: "Customer requested",
      // amount: 500, // Optional: partial refund
    });

    console.log("✓ Refund processed!");
    console.log(`  Refund ID: ${refund.id}`);
    console.log(`  Status: ${refund.status}`);
    console.log(`  Amount: $${refund.amount / 100}`);

    return refund;
  } catch (error) {
    console.error("✗ Error refunding payment:", error);
    throw error;
  }
}

// ============================================================================
// 3. SUBSCRIPTION EXAMPLES
// ============================================================================

async function exampleCreateSubscription(sdk: StreamPay) {
  console.log("\n📅 Creating a subscription...");

  try {
    const subscription = await sdk.subscriptions.create({
      amount: 2999, // $29.99 per month
      currency: "USDC",
      interval: "monthly",
      recipient_id: "user_wallet_address",
      privacy_mode: "cloak",
      trial_period_days: 7,
      metadata: {
        plan: "pro",
        userId: "user_123",
      },
    });

    console.log("✓ Subscription created!");
    console.log(`  ID: ${subscription.id}`);
    console.log(`  Plan: $${subscription.amount / 100}/${subscription.interval}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(
      `  Next billing: ${new Date(subscription.next_billing_at * 1000).toISOString()}`
    );

    if (subscription.trial_ends_at) {
      console.log(
        `  Trial ends: ${new Date(subscription.trial_ends_at * 1000).toISOString()}`
      );
    }

    return subscription;
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`✗ Error: [${error.code}] ${error.message}`);
    }
    throw error;
  }
}

async function exampleGetSubscriptionStatus(
  sdk: StreamPay,
  subscriptionId: string
) {
  console.log("\n🔍 Checking subscription status...");

  try {
    const subscription = await sdk.subscriptions.getStatus({
      subscription_id: subscriptionId,
    });

    console.log(`✓ Subscription found!`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Amount: $${subscription.amount / 100}/${subscription.interval}`);
    console.log(
      `  Next billing: ${new Date(subscription.next_billing_at * 1000).toISOString()}`
    );
    console.log(`  Total billed: ${subscription.total_billed_amount}x`);

    return subscription;
  } catch (error) {
    console.error("✗ Error checking subscription:", error);
    throw error;
  }
}

async function exampleUpdateSubscriptionAmount(
  sdk: StreamPay,
  subscriptionId: string
) {
  console.log("\n💰 Updating subscription amount...");

  try {
    const updated = await sdk.subscriptions.updateAmount({
      subscription_id: subscriptionId,
      new_amount: 3999, // $39.99 per month
      effective_from: "next_billing",
    });

    console.log("✓ Subscription updated!");
    console.log(`  New amount: $${updated.amount / 100}/${updated.interval}`);
    console.log(`  Effective from: ${updated.effective_from}`);

    return updated;
  } catch (error) {
    console.error("✗ Error updating subscription:", error);
    throw error;
  }
}

async function examplePauseResumeSubscription(
  sdk: StreamPay,
  subscriptionId: string
) {
  console.log("\n⏸️  Pausing subscription...");

  try {
    const paused = await sdk.subscriptions.pause({
      subscription_id: subscriptionId,
      reason: "Customer on vacation",
    });

    console.log("✓ Subscription paused!");
    console.log(`  Status: ${paused.status}`);

    // Wait a bit, then resume
    setTimeout(async () => {
      console.log("\n▶️  Resuming subscription...");

      const resumed = await sdk.subscriptions.resume(subscriptionId);
      console.log("✓ Subscription resumed!");
      console.log(`  Status: ${resumed.status}`);
    }, 2000);
  } catch (error) {
    console.error("✗ Error pausing subscription:", error);
    throw error;
  }
}

async function exampleCancelSubscription(
  sdk: StreamPay,
  subscriptionId: string
) {
  console.log("\n❌ Cancelling subscription...");

  try {
    const cancelled = await sdk.subscriptions.cancel({
      subscription_id: subscriptionId,
      reason: "Customer churn",
    });

    console.log("✓ Subscription cancelled!");
    console.log(`  Status: ${cancelled.status}`);
    console.log(`  Cancelled at: ${new Date(cancelled.cancelled_at * 1000).toISOString()}`);

    return cancelled;
  } catch (error) {
    console.error("✗ Error cancelling subscription:", error);
    throw error;
  }
}

async function exampleGetSubscriptionInvoices(
  sdk: StreamPay,
  subscriptionId: string
) {
  console.log("\n📄 Fetching subscription invoices...");

  try {
    const invoices = await sdk.subscriptions.getInvoices({
      subscription_id: subscriptionId,
      limit: 10,
      page: 1,
    });

    console.log(`✓ Found ${invoices.total} invoices`);

    invoices.data.forEach((invoice) => {
      console.log(
        `  - Invoice ${invoice.id}: $${invoice.amount / 100} (${
          invoice.status
        }) - ${new Date(invoice.created_at * 1000).toLocaleDateString()}`
      );
    });

    return invoices;
  } catch (error) {
    console.error("✗ Error fetching invoices:", error);
    throw error;
  }
}

// ============================================================================
// 4. ERROR HANDLING PATTERNS
// ============================================================================

async function exampleErrorHandling(sdk: StreamPay) {
  console.log("\n⚠️  Error handling example...");

  try {
    const payment = await sdk.payments.create({
      amount: 1000,
      currency: "INVALID_CURRENCY", // This will error
      recipient_id: "wallet",
      privacy_mode: "cloak",
      source_chain: "solana",
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`Error Code: ${error.code}`);
      console.error(`Status: ${error.statusCode}`);
      console.error(`Message: ${error.message}`);
      console.error(`Request ID: ${error.requestId}`);

      // Handle specific errors
      switch (error.code) {
        case "INVALID_REQUEST":
          console.error("Validation error - check your request parameters");
          break;
        case "RATE_LIMITED":
          console.error("Rate limited - wait before retrying");
          break;
        case "SERVER_ERROR":
          console.error("Server error - retry with backoff");
          break;
        case "UNAUTHORIZED":
          console.error("Invalid API key");
          break;
        default:
          console.error(`Unknown error: ${error.code}`);
      }
    } else {
      console.error("Non-API error:", error);
    }
  }
}

// ============================================================================
// 5. RETRY WITH BACKOFF PATTERN
// ============================================================================

async function exampleRetryWithBackoff(sdk: StreamPay) {
  console.log("\n🔄 Retry with backoff example...");

  async function createPaymentWithRetry(maxRetries = 3, baseDelay = 1000) {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const payment = await sdk.payments.create({
          amount: 1000,
          currency: "USDC",
          recipient_id: "wallet",
          privacy_mode: "cloak",
          source_chain: "solana",
        });

        console.log(`✓ Success on attempt ${attempt + 1}`);
        return payment;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof APIError) {
          if (error.code === "RATE_LIMITED" || error.statusCode === 503) {
            const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(
              `⏳ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new Error("Max retries exceeded");
  }

  try {
    const payment = await createPaymentWithRetry();
    console.log(`Final result: ${payment.id}`);
  } catch (error) {
    console.error("All retries failed:", error);
  }
}

// ============================================================================
// 6. MAIN EXECUTION
// ============================================================================

async function main() {
  console.log("🚀 StreamPay SDK Examples\n");
  console.log("=".repeat(60));

  try {
    // Initialize SDK
    const sdk = await initializeSDK();

    // Create a payment
    const payment = await exampleCreatePayment(sdk);

    // Check payment status
    await exampleCheckPaymentStatus(sdk, payment.id);

    // List payments
    await exampleListPayments(sdk);

    // Batch payments
    await exampleBatchPayments(sdk);

    // Refund a payment
    // await exampleRefundPayment(sdk, payment.id);

    // Create subscription
    const subscription = await exampleCreateSubscription(sdk);

    // Check subscription status
    await exampleGetSubscriptionStatus(sdk, subscription.id);

    // Update subscription
    // await exampleUpdateSubscriptionAmount(sdk, subscription.id);

    // Pause/Resume subscription
    // await examplePauseResumeSubscription(sdk, subscription.id);

    // Get invoices
    // await exampleGetSubscriptionInvoices(sdk, subscription.id);

    // Cancel subscription
    // await exampleCancelSubscription(sdk, subscription.id);

    // Error handling
    await exampleErrorHandling(sdk);

    // Retry with backoff
    await exampleRetryWithBackoff(sdk);

    console.log("\n" + "=".repeat(60));
    console.log("✓ All examples completed!");
  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    process.exit(1);
  }
}

// Run only if this file is executed directly
if (require.main === module) {
  main();
}

export {
  initializeSDK,
  exampleCreatePayment,
  exampleCheckPaymentStatus,
  exampleListPayments,
  exampleBatchPayments,
  exampleRefundPayment,
  exampleCreateSubscription,
  exampleGetSubscriptionStatus,
  exampleUpdateSubscriptionAmount,
  examplePauseResumeSubscription,
  exampleCancelSubscription,
  exampleGetSubscriptionInvoices,
  exampleErrorHandling,
  exampleRetryWithBackoff,
};
