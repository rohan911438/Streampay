/**
 * StreamPay HTTP Client
 * Handles API communication with error handling and authentication
 */

import { APIError } from "./types";
import {
  createHeaders,
  debug,
  parseErrorResponse,
  retryWithBackoff,
} from "./utils";

const DEFAULT_BASE_URL = "https://api.streampay.io";
const DEFAULT_TIMEOUT = 30000;

export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  debug?: boolean;
  headers?: Record<string, string>;
  retryAttempts?: number;
}

export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  timeout?: number;
  retryable?: boolean;
}

/**
 * HTTP Client for StreamPay API
 */
export class HTTPClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private debug: boolean;
  private customHeaders: Record<string, string>;
  private retryAttempts: number;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.debug = config.debug || false;
    this.customHeaders = config.headers || {};
    this.retryAttempts = config.retryAttempts || 3;

    debug("Client initialized", { baseUrl: this.baseUrl }, this.debug);
  }

  /**
   * Make HTTP request
   */
  async request<T>(options: RequestOptions): Promise<T> {
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const makeRequest = async (): Promise<T> => {
      const url = this.buildUrl(options.path, options.query);
      const headers = createHeaders(this.apiKey, this.customHeaders);
      const body =
        options.body && (options.method !== "GET" && options.method !== "DELETE")
          ? JSON.stringify(options.body)
          : undefined;

      debug(
        `${options.method} ${url}`,
        { requestId, body: options.body },
        this.debug
      );

      try {
        const response = await this.fetchWithTimeout(url, {
          method: options.method,
          headers,
          body,
          timeout: options.timeout || this.timeout,
        });

        debug(`Response status: ${response.status}`, { requestId }, this.debug);

        if (!response.ok) {
          let errorData: unknown;
          try {
            errorData = await response.json();
          } catch {
            errorData = await response.text();
          }

          const apiError = parseErrorResponse(
            errorData,
            response.status,
            requestId
          );
          throw apiError;
        }

        const responseData = await response.json();
        debug(
          "Response received",
          { requestId, data: responseData },
          this.debug
        );

        return responseData as T;
      } catch (error) {
        if (error instanceof APIError) {
          throw error;
        }

        if (error instanceof Error) {
          debug(`Request error: ${error.message}`, { requestId }, this.debug);
          throw new APIError(
            "REQUEST_ERROR",
            error.message,
            0,
            requestId
          );
        }

        throw new APIError(
          "UNKNOWN_ERROR",
          "An unknown error occurred",
          0,
          requestId
        );
      }
    };

    if (options.retryable !== false) {
      return retryWithBackoff(makeRequest, this.retryAttempts);
    }

    return makeRequest();
  }

  /**
   * GET request
   */
  async get<T>(
    path: string,
    query?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: "GET",
      path,
      query,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    body: Record<string, unknown>,
    query?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: "POST",
      path,
      body,
      query,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    body: Record<string, unknown>,
    query?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: "PUT",
      path,
      body,
      query,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    body: Record<string, unknown>,
    query?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: "PATCH",
      path,
      body,
      query,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    path: string,
    query?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>({
      method: "DELETE",
      path,
      query,
    });
  }

  /**
   * Build full URL
   */
  private buildUrl(
    path: string,
    query?: Record<string, unknown>
  ): string {
    const base = `${this.baseUrl}${path}`;

    if (!query || Object.keys(query).length === 0) {
      return base;
    }

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }

    return `${base}?${params.toString()}`;
  }

  /**
   * Fetch with timeout
   */
  private fetchWithTimeout(
    url: string,
    options: RequestInit & { timeout: number }
  ): Promise<Response> {
    const { timeout, ...fetchOptions } = options;

    return Promise.race([
      fetch(url, fetchOptions),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeout)
      ),
    ]);
  }
}
