import { Commitment, Connection } from "@solana/web3.js";

export const SOLANA_COMMITMENT: Commitment = "confirmed";

const FALLBACK_RPC_URL = "https://api.devnet.solana.com";

export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL ?? process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? FALLBACK_RPC_URL;

export const connection = new Connection(SOLANA_RPC_URL, {
  commitment: SOLANA_COMMITMENT,
  confirmTransactionInitialTimeout: 30_000,
});