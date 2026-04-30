/**
 * StreamPay SDK - Main Entry Point
 * Privacy-first, cross-chain payment infrastructure on Solana
 */

import { HTTPClient, ClientConfig } from "./client";
import { Payments } from "./payments";
import { Subscriptions } from "./subscriptions";
import { validateApiKey, debug } from "./utils";
import type { StreamPayConfig } from "./types";

// Re-export all types for convenience
export type * from "./types";

/**
 * StreamPay SDK
 *
 * Main class for interacting with StreamPay API
 *
 * @example
 * ```typescript
 * import { StreamPay } from "streampay-sdk";
 *
 * const sdk = new StreamPay({
 *   apiKey: "sp_live_abc123...",
 * });
 *
 * // Create a payment
 * const payment = await sdk.payments.create({
 *   amount: 1000,
 *   currency: "USDC",
 *   recipient_id: "0x...",
 *   privacy_mode: "cloak",
 *   source_chain: "solana",
 * });
 *
 * // Create a subscription
 * const subscription = await sdk.subscriptions.create({
 *   amount: 2999,
 *   currency: "USDC",
 *   interval: "monthly",
 *   recipient_id: "0x...",
 *   privacy_mode: "cloak",
 * });
 * ```
 */
export class StreamPay {
  private client: HTTPClient;
  private config: StreamPayConfig;

  /**
   * Payments module
   */
  public payments: Payments;

  /**
   * Subscriptions module
   */
  public subscriptions: Subscriptions;

  /**
   * Initialize StreamPay SDK
   *
   * @param config SDK configuration
   * @throws {Error} If API key is invalid or missing
   */
  constructor(config: StreamPayConfig) {
    if (!config.apiKey) {
      throw new Error(
        "API key is required. Get your API key from https://dashboard.streampay.io/developers"
      );
    }

    if (!validateApiKey(config.apiKey)) {
      console.warn(
        "WARNING: API key format does not match expected pattern. Ensure it starts with 'sp_live_' or 'sp_test_'"
      );
    }

    this.config = config;

    // Initialize HTTP client
    const clientConfig: ClientConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      timeout: config.timeout,
      debug: config.debug,
      headers: config.headers,
    };

    this.client = new HTTPClient(clientConfig);

    // Initialize modules
    this.payments = new Payments(this.client, config.debug);
    this.subscriptions = new Subscriptions(this.client, config.debug);

    debug("StreamPay SDK initialized", { version: "1.0.0" }, config.debug);
  }

  /**
   * Enable debug logging
   *
   * @example
   * ```typescript
   * sdk.enableDebug();
   * ```
   */
  public enableDebug(): void {
    this.config.debug = true;
    console.log("[StreamPay SDK] Debug logging enabled");
  }

  /**
   * Disable debug logging
   */
  public disableDebug(): void {
    this.config.debug = false;
  }

  /**
   * Get SDK version
   *
   * @returns SDK version
   */
  public getVersion(): string {
    return "1.0.0";
  }

  /**
   * Get current configuration
   *
   * @returns Configuration (without API key for security)
   */
  public getConfig(): Omit<StreamPayConfig, "apiKey"> {
    const { apiKey, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Health check - verify API connectivity
   *
   * @returns true if API is reachable
   *
   * @example
   * ```typescript
   * const isHealthy = await sdk.health();
   * console.log(`API healthy: ${isHealthy}`);
   * ```
   */
  public async health(): Promise<boolean> {
    try {
      const response = await this.client.get<{ status: string }>(
        "/api/v1/health"
      );
      return response.status === "ok";
    } catch {
      return false;
    }
  }
}

// Export all types and classes
export * from "./types";
export { HTTPClient } from "./client";
export { Payments } from "./payments";
export { Subscriptions } from "./subscriptions";
export {
  validateApiKey,
  generateIdempotencyKey,
  retryWithBackoff,
  formatAmount,
  isValidSolanaAddress,
  isValidEmail,
} from "./utils";
