/**
 * Subscription Manager Contract Integration
 * 
 * Provides utilities for interacting with the StreamPay Subscription Manager contract
 * deployed on Solana Devnet at: Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76
 * 
 * Upgrade Signature: TzkUpt83SxkEYky7Nz97kKoNaWExTrEW1FTjjksJhmGFhNQbHk2SW2xRH9gk71k84ZekF64cenFibWHJhxSSype
 * Timestamp: Apr 30, 2026 at 10:21:46 IST
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { SUBSCRIPTION_MANAGER_PROGRAM_ID } from "./constants";

/**
 * Subscription status tracked by the contract
 */
export enum SubscriptionStatus {
  Active = 0,
  Paused = 1,
  Expired = 2,
  Cancelled = 3,
}

/**
 * Subscription plan record on-chain structure
 */
export interface SubscriptionPlan {
  merchant: PublicKey;
  planId: number;
  amount: number;
  durationSeconds: number;
}

/**
 * Subscription record on-chain structure
 */
export interface Subscription {
  user: PublicKey;
  merchant: PublicKey;
  planId: number;
  amount: number;
  paymentRecord: PublicKey;
  startTimestamp: number;
  endTimestamp: number;
  status: SubscriptionStatus;
}

/**
 * Create a new subscription plan
 */
export async function createSubscriptionPlan(
  connection: Connection,
  merchant: Keypair,
  planId: number,
  amount: number,
  durationSeconds: number
): Promise<string> {
  const subscriptionPlan = Keypair.generate();

  // Instruction discriminator for create_subscription_plan
  const discriminator = Buffer.from([0x19, 0xc9, 0x3a, 0x90, 0x9c, 0x58, 0x3d, 0x7b]);

  // Encode parameters
  const planIdBuffer = Buffer.alloc(8);
  planIdBuffer.writeBigUInt64LE(BigInt(planId), 0);

  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(BigInt(amount), 0);

  const durationBuffer = Buffer.alloc(8);
  durationBuffer.writeBigInt64LE(BigInt(durationSeconds), 0);

  const instructionData = Buffer.concat([
    discriminator,
    planIdBuffer,
    amountBuffer,
    durationBuffer,
  ]);

  const instruction = {
    programId: SUBSCRIPTION_MANAGER_PROGRAM_ID,
    keys: [
      { pubkey: merchant.publicKey, isSigner: true, isWritable: true },
      { pubkey: subscriptionPlan.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    merchant,
    subscriptionPlan,
  ]);

  return signature;
}

/**
 * Activate a subscription after payment confirmation
 */
export async function activateSubscription(
  connection: Connection,
  authority: Keypair,
  subscriptionPlanPubkey: PublicKey,
  paymentRecordPubkey: PublicKey
): Promise<string> {
  const subscription = Keypair.generate();

  // Instruction discriminator for activate_subscription
  const discriminator = Buffer.from([0x18, 0x39, 0x4c, 0x5a, 0x2d, 0x2f, 0x1a, 0xb2]);

  // Encode payment record pubkey (32 bytes)
  const paymentRecordBuffer = paymentRecordPubkey.toBuffer();

  const instructionData = Buffer.concat([discriminator, paymentRecordBuffer]);

  const instruction = {
    programId: SUBSCRIPTION_MANAGER_PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      { pubkey: subscriptionPlanPubkey, isSigner: false, isWritable: false },
      { pubkey: paymentRecordPubkey, isSigner: false, isWritable: false },
      { pubkey: subscription.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    authority,
    subscription,
  ]);

  return signature;
}

/**
 * Renew an active subscription
 */
export async function renewSubscription(
  connection: Connection,
  authority: Keypair,
  subscriptionPubkey: PublicKey,
  subscriptionPlanPubkey: PublicKey,
  paymentRecordPubkey: PublicKey
): Promise<string> {
  // Instruction discriminator for renew_subscription
  const discriminator = Buffer.from([0x32, 0xfd, 0x2d, 0x8a, 0x1b, 0x18, 0x3c, 0xe9]);

  // Encode payment record pubkey (32 bytes)
  const paymentRecordBuffer = paymentRecordPubkey.toBuffer();

  const instructionData = Buffer.concat([discriminator, paymentRecordBuffer]);

  const instruction = {
    programId: SUBSCRIPTION_MANAGER_PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      { pubkey: subscriptionPubkey, isSigner: false, isWritable: true },
      { pubkey: subscriptionPlanPubkey, isSigner: false, isWritable: false },
      { pubkey: paymentRecordPubkey, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    authority,
  ]);

  return signature;
}

/**
 * Derive the PDA for a subscription plan
 */
export function deriveSubscriptionPlanPDA(
  merchant: PublicKey,
  planId: number
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("subscription_plan"),
      merchant.toBuffer(),
      Buffer.from(planId.toString()),
    ],
    SUBSCRIPTION_MANAGER_PROGRAM_ID
  );
  return pda;
}

/**
 * Derive the PDA for a subscription
 */
export function deriveSubscriptionPDA(
  user: PublicKey,
  planId: number
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("subscription"),
      user.toBuffer(),
      Buffer.from(planId.toString()),
    ],
    SUBSCRIPTION_MANAGER_PROGRAM_ID
  );
  return pda;
}

export default {
  createSubscriptionPlan,
  activateSubscription,
  renewSubscription,
  deriveSubscriptionPlanPDA,
  deriveSubscriptionPDA,
  SubscriptionStatus,
  SUBSCRIPTION_MANAGER_PROGRAM_ID,
};
