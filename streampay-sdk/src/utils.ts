/**
 * StreamPay SDK Utility Functions
 */

import { APIError, APIErrorResponse } from "./types";

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }
  // StreamPay API keys typically follow a pattern like: sp_live_xxx or sp_test_xxx
  return /^sp_(live|test)_[a-zA-Z0-9_]{32,}$/.test(apiKey);
}

/**
 * Generate idempotency key for duplicate prevention
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-retryable errors
      if (error instanceof APIError && !isRetryableError(error.statusCode)) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Check if error should be retried
 */
function isRetryableError(statusCode: number): boolean {
  // 5xx errors and 429 (too many requests) are retryable
  return statusCode >= 500 || statusCode === 429;
}

/**
 * Parse error response
 */
export function parseErrorResponse(
  error: unknown,
  statusCode: number,
  requestId?: string
): APIError {
  let code = "UNKNOWN_ERROR";
  let message = "An unknown error occurred";
  let details: Record<string, unknown> | undefined;

  if (typeof error === "object" && error !== null) {
    const errObj = error as APIErrorResponse;

    if (errObj.code) {
      code = errObj.code;
    }

    if (errObj.message) {
      message = errObj.message;
    }

    if (errObj.details) {
      details = errObj.details;
    }
  } else if (typeof error === "string") {
    message = error;
  }

  // Map HTTP status codes to error codes
  if (code === "UNKNOWN_ERROR") {
    if (statusCode === 400) code = "INVALID_REQUEST";
    else if (statusCode === 401) code = "UNAUTHORIZED";
    else if (statusCode === 403) code = "FORBIDDEN";
    else if (statusCode === 404) code = "NOT_FOUND";
    else if (statusCode === 429) code = "RATE_LIMITED";
    else if (statusCode >= 500) code = "SERVER_ERROR";
  }

  return new APIError(code, message, statusCode, requestId, details);
}

/**
 * Format amount for display
 */
export function formatAmount(
  amount: number,
  currency: string,
  decimals: number = 2
): string {
  const formatted = (amount / Math.pow(10, decimals)).toFixed(decimals);
  return `${formatted} ${currency}`;
}

/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded and 32-44 characters long
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Merge query parameters into URL
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        typeof sourceValue === "object" &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === "object" &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        ) as unknown as T[Extract<keyof T, string>];
      } else {
        result[key] = sourceValue as unknown as T[Extract<keyof T, string>];
      }
    }
  }

  return result;
}

/**
 * Create a safe JSON stringifier (circular reference safe)
 */
export function safeStringify(obj: unknown, indent: number = 2): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    },
    indent
  );
}

/**
 * Create headers object for HTTP requests
 */
export function createHeaders(
  apiKey: string,
  customHeaders?: Record<string, string>
): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${apiKey}`,
    "User-Agent": `StreamPay-SDK/1.0.0`,
    ...(customHeaders || {}),
  };
}

/**
 * Log debug message
 */
export function debug(message: string, data?: unknown, isEnabled: boolean = false): void {
  if (isEnabled) {
    if (data !== undefined) {
      console.log(`[StreamPay SDK] ${message}`, data);
    } else {
      console.log(`[StreamPay SDK] ${message}`);
    }
  }
}
