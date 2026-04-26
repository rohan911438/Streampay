import { NextResponse } from "next/server";
import { findOrCreateUserByWallet, isLikelySolanaWalletAddress } from "@/lib/subscriptions-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const user = await findOrCreateUserByWallet(walletAddress);

    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        createdAt: user.created_at ?? null,
        updatedAt: user.updated_at ?? null,
      },
    });
  } catch (error) {
    console.error("[users/sync] failed to sync wallet user", error);
    return NextResponse.json({ error: "Failed to sync wallet user." }, { status: 500 });
  }
}
