/**
 * StreamPay Subscriptions Module
 * Handles subscription-related operations
 */

import { HTTPClient } from "./client";
import {
  CreateSubscriptionRequest,
  SubscriptionResponse,
  GetSubscriptionStatusRequest,
  CancelSubscriptionRequest,
  PaginatedResponse,
} from "./types";
import { debug } from "./utils";

export class Subscriptions {
  constructor(
    private client: HTTPClient,
    private debug: boolean = false
  ) {}

  /**
   * Create a new subscription
   *
   * @example
   * ```typescript
   * const subscription = await sdk.subscriptions.create({
   *   amount: 2999, // $29.99 per month
   *   currency: "USDC",
   *   interval: "monthly",
   *   recipient_id: "0x...",
   *   privacy_mode: "cloak",
   *   trial_period_days: 7,
   * });
   *
   * console.log(`Subscription created: ${subscription.id}`);
   * console.log(`Next billing: ${new Date(subscription.next_billing_at * 1000)}`);
   * ```
   */
  async create(
    request: CreateSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    debug(
      "Creating subscription",
      {
        amount: request.amount,
        interval: request.interval,
      },
      this.debug
    );

    const response = await this.client.post<SubscriptionResponse>(
      "/api/v1/subscriptions",
      {
        amount: request.amount,
        currency: request.currency,
        interval: request.interval,
        recipient_id: request.recipient_id,
        privacy_mode: request.privacy_mode,
        metadata: request.metadata,
        trial_period_days: request.trial_period_days,
      }
    );

    debug(
      "Subscription created successfully",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * Get subscription status
   *
   * @example
   * ```typescript
   * const subscription = await sdk.subscriptions.getStatus({
   *   subscription_id: "sub_abc123...",
   * });
   *
   * if (subscription.status === "active") {
   *   console.log(`Next billing: ${new Date(subscription.next_billing_at * 1000)}`);
   * }
   * ```
   */
  async getStatus(
    request: GetSubscriptionStatusRequest
  ): Promise<SubscriptionResponse> {
    debug(
      "Fetching subscription status",
      { id: request.subscription_id },
      this.debug
    );

    const response = await this.client.get<SubscriptionResponse>(
      `/api/v1/subscriptions/${request.subscription_id}`
    );

    debug(
      "Subscription status retrieved",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * List subscriptions with pagination
   *
   * @example
   * ```typescript
   * const subscriptions = await sdk.subscriptions.list({
   *   limit: 20,
   *   page: 1,
   *   status: "active",
   * });
   *
   * console.log(`Active subscriptions: ${subscriptions.total}`);
   * ```
   */
  async list(query?: {
    limit?: number;
    page?: number;
    status?: string;
    recipient_id?: string;
  }): Promise<PaginatedResponse<SubscriptionResponse>> {
    debug("Listing subscriptions", query, this.debug);

    const response =
      await this.client.get<PaginatedResponse<SubscriptionResponse>>(
        "/api/v1/subscriptions",
        {
          limit: query?.limit || 50,
          page: query?.page || 1,
          ...(query?.status && { status: query.status }),
          ...(query?.recipient_id && { recipient_id: query.recipient_id }),
        }
      );

    debug(
      "Subscriptions listed",
      { total: response.total, count: response.data.length },
      this.debug
    );

    return response;
  }

  /**
   * Update subscription amount (for next billing cycle)
   *
   * @example
   * ```typescript
   * const updated = await sdk.subscriptions.updateAmount({
   *   subscription_id: "sub_abc123...",
   *   new_amount: 3999, // New $39.99 per month
   *   effective_from: "next_billing", // or "immediately"
   * });
   *
   * console.log(`Updated to: $${updated.amount / 100}`);
   * ```
   */
  async updateAmount(request: {
    subscription_id: string;
    new_amount: number;
    effective_from?: "immediately" | "next_billing";
  }): Promise<SubscriptionResponse> {
    debug(
      "Updating subscription amount",
      {
        id: request.subscription_id,
        new_amount: request.new_amount,
      },
      this.debug
    );

    const response = await this.client.patch<SubscriptionResponse>(
      `/api/v1/subscriptions/${request.subscription_id}`,
      {
        amount: request.new_amount,
        effective_from: request.effective_from || "next_billing",
      }
    );

    debug(
      "Subscription amount updated",
      { id: response.id, new_amount: response.amount },
      this.debug
    );

    return response;
  }

  /**
   * Pause a subscription
   *
   * @example
   * ```typescript
   * const paused = await sdk.subscriptions.pause({
   *   subscription_id: "sub_abc123...",
   *   reason: "Temporary pause",
   * });
   *
   * console.log(`Status: ${paused.status}`); // "paused"
   * ```
   */
  async pause(request: {
    subscription_id: string;
    reason?: string;
  }): Promise<SubscriptionResponse> {
    debug(
      "Pausing subscription",
      { id: request.subscription_id },
      this.debug
    );

    const response = await this.client.post<SubscriptionResponse>(
      `/api/v1/subscriptions/${request.subscription_id}/pause`,
      {
        reason: request.reason,
      }
    );

    debug(
      "Subscription paused",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * Resume a paused subscription
   *
   * @example
   * ```typescript
   * const resumed = await sdk.subscriptions.resume({
   *   subscription_id: "sub_abc123...",
   * });
   *
   * console.log(`Status: ${resumed.status}`); // "active"
   * ```
   */
  async resume(subscription_id: string): Promise<SubscriptionResponse> {
    debug("Resuming subscription", { id: subscription_id }, this.debug);

    const response = await this.client.post<SubscriptionResponse>(
      `/api/v1/subscriptions/${subscription_id}/resume`,
      {}
    );

    debug(
      "Subscription resumed",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * Cancel a subscription
   *
   * @example
   * ```typescript
   * const cancelled = await sdk.subscriptions.cancel({
   *   subscription_id: "sub_abc123...",
   *   reason: "Customer requested",
   * });
   *
   * console.log(`Status: ${cancelled.status}`); // "canceled"
   * ```
   */
  async cancel(
    request: CancelSubscriptionRequest
  ): Promise<SubscriptionResponse> {
    debug(
      "Canceling subscription",
      { id: request.subscription_id },
      this.debug
    );

    const response = await this.client.post<SubscriptionResponse>(
      `/api/v1/subscriptions/${request.subscription_id}/cancel`,
      {
        reason: request.reason,
      }
    );

    debug(
      "Subscription canceled",
      { id: response.id, status: response.status },
      this.debug
    );

    return response;
  }

  /**
   * Get upcoming invoice for a subscription
   *
   * @example
   * ```typescript
   * const invoice = await sdk.subscriptions.getUpcomingInvoice({
   *   subscription_id: "sub_abc123...",
   * });
   *
   * console.log(`Next charge: $${invoice.amount / 100}`);
   * console.log(`Date: ${new Date(invoice.due_date * 1000)}`);
   * ```
   */
  async getUpcomingInvoice(subscription_id: string): Promise<{
    id: string;
    subscription_id: string;
    amount: number;
    currency: string;
    due_date: number;
    status: string;
  }> {
    debug(
      "Fetching upcoming invoice",
      { id: subscription_id },
      this.debug
    );

    const response = await this.client.get<{
      id: string;
      subscription_id: string;
      amount: number;
      currency: string;
      due_date: number;
      status: string;
    }>(`/api/v1/subscriptions/${subscription_id}/upcoming-invoice`);

    return response;
  }

  /**
   * Get subscription invoices
   *
   * @example
   * ```typescript
   * const invoices = await sdk.subscriptions.getInvoices({
   *   subscription_id: "sub_abc123...",
   *   limit: 10,
   * });
   *
   * console.log(`Total invoices: ${invoices.total}`);
   * invoices.data.forEach((invoice) => {
   *   console.log(`${invoice.id}: $${invoice.amount / 100}`);
   * });
   * ```
   */
  async getInvoices(request: {
    subscription_id: string;
    limit?: number;
    page?: number;
  }): Promise<
    PaginatedResponse<{
      id: string;
      amount: number;
      currency: string;
      paid_date: number;
      status: string;
    }>
  > {
    debug(
      "Fetching subscription invoices",
      { id: request.subscription_id },
      this.debug
    );

    const response = await this.client.get<
      PaginatedResponse<{
        id: string;
        amount: number;
        currency: string;
        paid_date: number;
        status: string;
      }>
    >(`/api/v1/subscriptions/${request.subscription_id}/invoices`, {
      limit: request.limit || 50,
      page: request.page || 1,
    });

    return response;
  }

  /**
   * Check if subscription is active
   *
   * @example
   * ```typescript
   * const isActive = await sdk.subscriptions.isActive("sub_abc123...");
   * console.log(`Subscription active: ${isActive}`);
   * ```
   */
  async isActive(subscription_id: string): Promise<boolean> {
    try {
      const subscription = await this.getStatus({ subscription_id });
      return subscription.status === "active";
    } catch {
      return false;
    }
  }

  /**
   * Get subscription usage metrics
   *
   * @example
   * ```typescript
   * const metrics = await sdk.subscriptions.getMetrics({
   *   subscription_id: "sub_abc123...",
   * });
   *
   * console.log(`Total revenue: $${metrics.total_revenue / 100}`);
   * console.log(`Billing cycles: ${metrics.total_cycles}`);
   * ```
   */
  async getMetrics(subscription_id: string): Promise<{
    total_cycles: number;
    total_revenue: number;
    last_payment_date: number;
    next_payment_date: number;
    failed_attempts: number;
  }> {
    debug(
      "Fetching subscription metrics",
      { id: subscription_id },
      this.debug
    );

    const response = await this.client.get<{
      total_cycles: number;
      total_revenue: number;
      last_payment_date: number;
      next_payment_date: number;
      failed_attempts: number;
    }>(`/api/v1/subscriptions/${subscription_id}/metrics`);

    return response;
  }
}
