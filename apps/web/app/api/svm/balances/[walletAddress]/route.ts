import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DUNE_SIM_BASE_URL = "https://api.sim.dune.com";

type DuneBalanceItem = {
  symbol?: string;
  token_symbol?: string;
  name?: string;
  token_name?: string;
  mint?: string;
  mint_address?: string;
  amount?: number | string;
  balance?: number | string;
  ui_amount?: number | string;
  uiAmount?: number | string;
  usd_value?: number | string;
  usdValue?: number | string;
};

type NormalizedTokenBalance = {
  symbol: string;
  name: string;
  mintAddress: string | null;
  amount: number;
  usdValue: number;
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

function parseBalanceItems(payload: unknown): DuneBalanceItem[] {
  if (Array.isArray(payload)) {
    return payload as DuneBalanceItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as DuneBalanceItem[];
  }

  if (record.data && typeof record.data === "object") {
    const nestedData = record.data as Record<string, unknown>;
    if (Array.isArray(nestedData.items)) {
      return nestedData.items as DuneBalanceItem[];
    }
    if (Array.isArray(nestedData.balances)) {
      return nestedData.balances as DuneBalanceItem[];
    }
  }

  if (Array.isArray(record.items)) {
    return record.items as DuneBalanceItem[];
  }

  if (Array.isArray(record.balances)) {
    return record.balances as DuneBalanceItem[];
  }

  return [];
}

function normalizeTokenBalance(item: DuneBalanceItem): NormalizedTokenBalance {
  const symbol = (item.symbol ?? item.token_symbol ?? "UNKNOWN").toString();
  const name = (item.name ?? item.token_name ?? symbol).toString();
  const mintAddress = item.mint ?? item.mint_address ?? null;
  const amount = asNumber(item.ui_amount ?? item.uiAmount ?? item.amount ?? item.balance);
  const usdValue = asNumber(item.usd_value ?? item.usdValue);

  return {
    symbol,
    name,
    mintAddress: mintAddress ? mintAddress.toString() : null,
    amount,
    usdValue,
  };
}

function getDuneApiKey(): string | null {
  const key =
    process.env.DUNE_SIM_API_KEY?.trim() ||
    process.env.DUNE_API_KEY?.trim() ||
    null;

  return key && key.length > 0 ? key : null;
}

export async function GET(
  req: Request,
  context: { params: { walletAddress: string } }
) {
  const apiKey = getDuneApiKey();

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

  try {
    const upstreamUrl = `${DUNE_SIM_BASE_URL}/beta/svm/balances/${encodeURIComponent(
      walletAddress
    )}?chain=${encodeURIComponent(chain)}`;

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
          error: "Failed to fetch wallet balances from Dune SIM.",
          details: message,
          upstreamStatus: response.status,
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
      );
    }

    const balances = parseBalanceItems(payload).map(normalizeTokenBalance);
    const totalUsdValue = balances.reduce((sum, token) => sum + token.usdValue, 0);
    const totalBalance = balances.reduce((sum, token) => sum + token.amount, 0);

    return NextResponse.json(
      {
        walletAddress,
        chain,
        summary: {
          totalBalance,
          totalUsdValue,
          tokenCount: balances.length,
        },
        tokens: balances,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[svm-balances] failed", error);
    return NextResponse.json(
      {
        error: "Unexpected error while fetching wallet balances.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
