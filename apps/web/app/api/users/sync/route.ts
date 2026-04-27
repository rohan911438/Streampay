import { NextResponse } from "next/server";
import { jsonDb } from "@/lib/json-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLikelySolanaWalletAddress(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

type SyncUserRequestBody = {
  walletAddress?: string;
};

export async function POST(req: Request) {
  let body: SyncUserRequestBody;

  try {
    body = (await req.json()) as SyncUserRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const walletAddress = body.walletAddress?.trim();

  if (!walletAddress || !isLikelySolanaWalletAddress(walletAddress)) {
    return NextResponse.json({ error: "A valid wallet address is required." }, { status: 400 });
  }

  try {
    const user = await jsonDb.findOrCreateUser(walletAddress);

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("[users/sync] failed to sync wallet user", error);
    return NextResponse.json({ error: "Failed to sync wallet user." }, { status: 500 });
  }
}
