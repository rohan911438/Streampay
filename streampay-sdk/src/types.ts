/**
 * StreamPay SDK Type Definitions
 * Comprehensive TypeScript interfaces for StreamPay API
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Currency = "USDC" | "USDT" | "SOL";
export type PrivacyMode = "cloak" | "public";
export type SubscriptionInterval = "weekly" | "monthly" | "yearly";
export type PaymentStatus = "pending" | "completed" | "failed" | "expired";
export type SubscriptionStatus = "active" | "inactive" | "paused" | "canceled";

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreatePaymentRequest {
  /** Amount in the smallest unit (e.g., cents for USD, lamports for SOL) */
  amount: number;
  /** Currency to charge in */
  currency: Currency;
  /** Recipient's wallet address or ID */
  recipient_id: string;
  /** Enable Cloak privacy layer */
  privacy_mode: PrivacyMode;
  /** Source blockchain */
  source_chain: "solana";
  /** Optional custom metadata */
  metadata?: Record<string, unknown>;
  /** Optional idempotency key for duplicate prevention */
  idempotency_key?: string;
}

export interface CreateSubscriptionRequest {
  /** Recurring amount in smallest unit */
  amount: number;
  /** Currency for recurring billing */
  currency: Currency;
  /** Billing interval */
  interval: SubscriptionInterval;
  /** Recipient's wallet address or ID */
  recipient_id: string;
  /** Enable Cloak privacy layer */
  privacy_mode: PrivacyMode;
  /** Optional custom metadata */
  metadata?: Record<string, unknown>;
  /** Optional trial period in days */
  trial_period_days?: number;
}

export interface GetPaymentStatusRequest {
  /** Payment ID to look up */
  payment_id: string;
}

export interface GetSubscriptionStatusRequest {
  /** Subscription ID to look up */
  subscription_id: string;
}

export interface CancelSubscriptionRequest {
  /** Subscription ID to cancel */
  subscription_id: string;
  /** Reason for cancellation (optional) */
  reason?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PaymentResponse {
  /** Unique payment identifier */
  id: string;
  /** Amount charged */
  amount: number;
  /** Currency charged in */
  currency: Currency;
  /** Recipient wallet address */
  recipient_id: string;
  /** Current payment status */
  status: PaymentStatus;
  /** Privacy mode used */
  privacy_mode: PrivacyMode;
  /** Solana transaction signature */
  transaction_signature?: string;
  /** MagicBlock execution reference */
  magicblock_reference?: string;
  /** Cloak transaction ID */
  cloak_tx_id?: string;
  /** Unix timestamp of creation */
  created_at: number;
  /** Unix timestamp of last update */
  updated_at: number;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Error message (if failed) */
  error?: string;
}

export interface SubscriptionResponse {
  /** Unique subscription identifier */
  id: string;
  /** Current amount per billing cycle */
  amount: number;
  /** Billing currency */
  currency: Currency;
  /** Billing interval */
  interval: SubscriptionInterval;
  /** Recipient wallet address */
  recipient_id: string;
  /** Current subscription status */
  status: SubscriptionStatus;
  /** Privacy mode used */
  privacy_mode: PrivacyMode;
  /** Unix timestamp of next billing cycle */
  next_billing_at: number;
  /** Unix timestamp of subscription start */
  started_at: number;
  /** Unix timestamp of last update */
  updated_at: number;
  /** Trial end timestamp (if applicable) */
  trial_ends_at?: number;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Error message (if failed) */
  error?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Total count of items */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Whether more pages exist */
  has_more: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface APIErrorResponse {
  /** Error code for categorization */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Request ID for debugging */
  request_id?: string;
}

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public requestId?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

export interface StreamPayConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for API (defaults to production) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
  /** Custom headers to include with every request */
  headers?: Record<string, string>;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export type WebhookEventType = 
  | "payment.completed"
  | "payment.failed"
  | "subscription.created"
  | "subscription.renewed"
  | "subscription.canceled"
  | "subscription.failed";

export interface WebhookEvent {
  /** Event type */
  type: WebhookEventType;
  /** Event data */
  data: PaymentResponse | SubscriptionResponse;
  /** Unix timestamp */
  timestamp: number;
  /** Event ID for idempotency */
  id: string;
}

// ============================================================================
// BATCH OPERATION TYPES
// ============================================================================

export interface BatchPaymentRequest {
  /** Array of payment requests */
  payments: CreatePaymentRequest[];
  /** Stop on first error */
  stop_on_error?: boolean;
}

export interface BatchPaymentResponse {
  /** Array of payment responses */
  results: (PaymentResponse | APIError)[];
  /** Number of successful payments */
  successful: number;
  /** Number of failed payments */
  failed: number;
}
