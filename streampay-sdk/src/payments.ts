/**
 * StreamPay Payments Module
 * Handles payment-related operations
 */

import { HTTPClient } from "./client";
import {
  CreatePaymentRequest,
  PaymentResponse,
  GetPaymentStatusRequest,
  PaginatedResponse,
  BatchPaymentRequest,
  BatchPaymentResponse,
} from "./types";
import { debug, generateIdempotencyKey } from "./utils";

export class Payments {
  constructor(
    private client: HTTPClient,
    private debug: boolean = false
  ) {}

  /**
   * Create a new payment
   *
   * @example
   * ```typescript
   * const payment = await sdk.payments.create({
   *   amount: 1000, // $10.00 in cents
   *   currency: "USDC",
   *   recipient_id: "0x...",
   *   privacy_mode: "cloak",
   *   source_chain: "solana",
   * });
   *
   * console.log(`Payment created: ${payment.id}`);
   * console.log(`Status: ${payment.status}`);
   * console.log(`TX: ${payment.transaction_signature}`);
   * ```
   */
  async create(request: CreatePaymentRequest): Promise<PaymentResponse> {
    debug(
      "Creating payment",
      { amount: request.amount, currency: request.currency },
      this.debug
    );

    // Auto-generate idempotency key if not provided
    const idempotencyKey =
      request.idempotency_key || generateIdempotencyKey();

    const response = await this.client.post<PaymentResponse>(
      "/api/v1/payments",
      {
        amount: request.amount,
        currency: request.currency,
        recipient_id: request.recipient_id,
        privacy_mode: request.privacy_mode,
        source_chain: request.source_chain,
        metadata: request.metadata,
      },
      {
        "idempotency_key": idempotencyKey,
      }
    );

    debug("Payment created successfully", { id: response.id }, this.debug);
    return response;
  }

  /**
   * Get payment status
   *
   * @example
   * ```typescript
   * const payment = await sdk.payments.getStatus({
   *   payment_id: "pay_abc123...",
   * });
   *
   * if (payment.status === "completed") {
   *   console.log("Payment successful!");
   *   console.log(`Transaction: ${payment.transaction_signature}`);
   * }
   * ```
   */
  async getStatus(request: GetPaymentStatusRequest): Promise<PaymentResponse> {
    debug("Fetching payment status", { id: request.payment_id }, this.debug);

    const response = await this.client.get<PaymentResponse>(
      `/api/v1/payments/${request.payment_id}`
    );

    debug(
      "Payment status retrieved",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * List payments with pagination
   *
   * @example
   * ```typescript
   * const payments = await sdk.payments.list({
   *   limit: 10,
   *   page: 1,
   * });
   *
   * console.log(`Total: ${payments.total}`);
   * console.log(`Payments: ${payments.data.length}`);
   * ```
   */
  async list(query?: {
    limit?: number;
    page?: number;
    status?: string;
    recipient_id?: string;
  }): Promise<PaginatedResponse<PaymentResponse>> {
    debug("Listing payments", query, this.debug);

    const response = await this.client.get<PaginatedResponse<PaymentResponse>>(
      "/api/v1/payments",
      {
        limit: query?.limit || 50,
        page: query?.page || 1,
        ...(query?.status && { status: query.status }),
        ...(query?.recipient_id && { recipient_id: query.recipient_id }),
      }
    );

    debug(
      "Payments listed",
      { total: response.total, count: response.data.length },
      this.debug
    );

    return response;
  }

  /**
   * Get payment by custom reference ID
   *
   * @example
   * ```typescript
   * const payment = await sdk.payments.getByReference({
   *   reference_id: "order_12345",
   * });
   * ```
   */
  async getByReference(reference_id: string): Promise<PaymentResponse> {
    debug("Fetching payment by reference", { reference_id }, this.debug);

    const response = await this.client.get<PaymentResponse>(
      `/api/v1/payments/ref/${reference_id}`
    );

    return response;
  }

  /**
   * Batch create multiple payments
   *
   * @example
   * ```typescript
   * const results = await sdk.payments.createBatch({
   *   payments: [
   *     {
   *       amount: 1000,
   *       currency: "USDC",
   *       recipient_id: "wallet1",
   *       privacy_mode: "cloak",
   *       source_chain: "solana",
   *     },
   *     {
   *       amount: 2000,
   *       currency: "USDC",
   *       recipient_id: "wallet2",
   *       privacy_mode: "public",
   *       source_chain: "solana",
   *     },
   *   ],
   *   stop_on_error: false,
   * });
   *
   * console.log(`Successful: ${results.successful}`);
   * console.log(`Failed: ${results.failed}`);
   * ```
   */
  async createBatch(
    request: BatchPaymentRequest
  ): Promise<BatchPaymentResponse> {
    debug(
      "Creating batch payments",
      { count: request.payments.length },
      this.debug
    );

    // Add idempotency keys to all payments
    const paymentsWithKeys = request.payments.map((payment) => ({
      ...payment,
      idempotency_key: payment.idempotency_key || generateIdempotencyKey(),
    }));

    const response = await this.client.post<BatchPaymentResponse>(
      "/api/v1/payments/batch",
      {
        payments: paymentsWithKeys,
        stop_on_error: request.stop_on_error || false,
      }
    );

    debug(
      "Batch payments completed",
      { successful: response.successful, failed: response.failed },
      this.debug
    );

    return response;
  }

  /**
   * Refund a payment
   *
   * @example
   * ```typescript
   * const refund = await sdk.payments.refund({
   *   payment_id: "pay_abc123...",
   *   reason: "Customer requested",
   * });
   *
   * console.log(`Refund status: ${refund.status}`);
   * ```
   */
  async refund(request: {
    payment_id: string;
    reason?: string;
    amount?: number;
  }): Promise<PaymentResponse> {
    debug("Refunding payment", { id: request.payment_id }, this.debug);

    const response = await this.client.post<PaymentResponse>(
      `/api/v1/payments/${request.payment_id}/refund`,
      {
        reason: request.reason,
        amount: request.amount,
      }
    );

    debug("Payment refunded successfully", { id: response.id }, this.debug);

    return response;
  }

  /**
   * Check if payment can be refunded
   *
   * @example
   * ```typescript
   * const canRefund = await sdk.payments.canRefund("pay_abc123...");
   * console.log(`Can refund: ${canRefund}`);
   * ```
   */
  async canRefund(payment_id: string): Promise<boolean> {
    try {
      const payment = await this.getStatus({ payment_id });
      return (
        payment.status === "completed" &&
        (!payment.metadata?.refunded || payment.metadata.refunded === false)
      );
    } catch {
      return false;
    }
  }

  /**
   * Verify payment signature (for webhooks)
   *
   * @example
   * ```typescript
   * const isValid = sdk.payments.verifyWebhookSignature(
   *   payload,
   *   signature,
   *   webhookSecret
   * );
   *
   * if (isValid) {
   *   console.log("Webhook is authentic");
   * }
   * ```
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // In production, use HMAC-SHA256
    // This is a simplified example
    const expectedSignature = Buffer.from(
      `${payload}.${secret}`,
      "utf-8"
    ).toString("base64");

    return signature === expectedSignature;
  }
}
