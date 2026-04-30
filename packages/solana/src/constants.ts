import { PublicKey } from "@solana/web3.js";

// Devnet USDC mint used for development and testing flows.
export const USDC_DEVNET_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

// Payment Router Contract (Deployed on Solana Devnet)
// Deployment Signature: 5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy
export const PAYMENT_ROUTER_PROGRAM_ID = new PublicKey("Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76");

// Subscription Manager Contract (Deployed on Solana Devnet)
// Upgrade Signature: TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype
export const SUBSCRIPTION_MANAGER_PROGRAM_ID = new PublicKey("Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76");