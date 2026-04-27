import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DUNE_SIM_BASE_URL = "https://api.sim.dune.com";
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 20;

type DuneTransactionItem = {
  signature?: string;
  hash?: string;
  tx_hash?: string;
  timestamp?: string | number;
  block_time?: string | number;
  time?: string | number;
  type?: string;
  tx_type?: string;
  category?: string;
  program?: string;
  amount?: number | string;
  ui_amount?: number | string;
  uiAmount?: number | string;
  value?: number | string;
  native_amount?: number | string;
  usd_value?: number | string;
  usdValue?: number | string;
  status?: string;
};

type NormalizedTransaction = {
  signature: string | null;
  timestamp: string | null;
  type: string;
  amount: number;
  usdValue: number;
  status: string;
};

function isLikelySolanaWalletAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

function asNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function toIsoTimestamp(value: unknown): string | null {
  if (typeof value === "string") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toISOString();
    }

    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      const millis = asNumber > 1e12 ? asNumber : asNumber * 1000;
      const date = new Date(millis);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1e12 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function parseTransactions(payload: unknown): DuneTransactionItem[] {
  if (Array.isArray(payload)) {
    return payload as DuneTransactionItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as DuneTransactionItem[];
  }

  if (record.data && typeof record.data === "object") {
    const nestedData = record.data as Record<string, unknown>;
    if (Array.isArray(nestedData.items)) {
      return nestedData.items as DuneTransactionItem[];
    }
    if (Array.isArray(nestedData.transactions)) {
      return nestedData.transactions as DuneTransactionItem[];
    }
  }

  if (Array.isArray(record.items)) {
    return record.items as DuneTransactionItem[];
  }

  if (Array.isArray(record.transactions)) {
    return record.transactions as DuneTransactionItem[];
  }

  return [];
}

function normalizeTransaction(item: DuneTransactionItem): NormalizedTransaction {
  const amount = asNumber(
    item.ui_amount ?? item.uiAmount ?? item.amount ?? item.value ?? item.native_amount
  );
  const usdValue = asNumber(item.usd_value ?? item.usdValue);

  return {
    signature: (item.signature ?? item.hash ?? item.tx_hash ?? null) as string | null,
    timestamp: toIsoTimestamp(item.timestamp ?? item.block_time ?? item.time),
    type: (item.type ?? item.tx_type ?? item.category ?? item.program ?? "unknown").toString(),
    amount,
    usdValue,
    status: (item.status ?? "unknown").toString(),
  };
}

function parseLimit(rawLimit: string | null): number {
  const parsed = rawLimit ? Number(rawLimit) : DEFAULT_LIMIT;
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  const integer = Math.floor(parsed);
  if (integer < 1) {
    return 1;
  }
  if (integer > MAX_LIMIT) {
    return MAX_LIMIT;
  }
  return integer;
}

export async function GET(
  req: Request,
  context: { params: { walletAddress: string } }
) {
  const apiKey = process.env.DUNE_SIM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "DUNE_SIM_API_KEY is not configured.",
      },
      { status: 500 }
    );
  }

  const walletAddress = context.params.walletAddress?.trim();

  if (!walletAddress || !isLikelySolanaWalletAddress(walletAddress)) {
    return NextResponse.json(
      { error: "A valid Solana wallet address is required in the path." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const chain = searchParams.get("chain")?.trim() || "solana";
  const limit = parseLimit(searchParams.get("limit"));

  try {
    const upstreamUrl = `${DUNE_SIM_BASE_URL}/beta/svm/transactions/${encodeURIComponent(
      walletAddress
    )}?chain=${encodeURIComponent(chain)}&limit=${limit}`;

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "X-Sim-Api-Key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload && typeof payload === "object"
          ? ((payload as Record<string, unknown>).error ??
              (payload as Record<string, unknown>).message ??
              "Dune SIM API request failed")
          : "Dune SIM API request failed";

      return NextResponse.json(
        {
          error: "Failed to fetch wallet transactions from Dune SIM.",
          details: message,
          upstreamStatus: response.status,
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    const transactions = parseTransactions(payload)
      .map(normalizeTransaction)
      .slice(0, limit);

    return NextResponse.json(
      {
        walletAddress,
        chain,
        limit,
        count: transactions.length,
        transactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[svm-transactions] failed", error);
    return NextResponse.json(
      {
        error: "Unexpected error while fetching wallet transactions.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
