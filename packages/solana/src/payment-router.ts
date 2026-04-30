/**
 * Payment Router Contract Integration
 * 
 * Provides utilities for interacting with the StreamPay Payment Router contract
 * deployed on Solana Devnet at: Bs464Nm3DY6qNafJn5kmVHxh9R8nKRLpuXfdDrZQMd76
 * 
 * Deployment Signature: 5QV3WoHgcumYgH5brQpBKBdNcfAoeZt2XCofdrJG8y65JxEX8rdhpzGhGeY1usT1eDefzdp4kmpfk1iv5smFfJHy
 * Timestamp: Apr 30, 2026 at 10:15:33 IST
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { PAYMENT_ROUTER_PROGRAM_ID } from "./constants";

/**
 * Payment types supported by the contract
 */
export enum PaymentType {
  Private = 0,
  Public = 1,
}

/**
 * Payment status tracked by the contract
 */
export enum PaymentStatus {
  Pending = 0,
  Completed = 1,
}

/**
 * Payment record on-chain structure
 */
export interface PaymentRecord {
  user: PublicKey;
  merchant: PublicKey;
  amount: number;
  paymentType: PaymentType;
  executionReference: string;
  timestamp: number;
  status: PaymentStatus;
}

/**
 * Create a new payment record on the Payment Router contract
 */
export async function createPaymentRecord(
  connection: Connection,
  user: Keypair,
  merchant: PublicKey,
  amount: number,
  paymentType: PaymentType
): Promise<string> {
  // Generate a new keypair for the payment record PDA
  const paymentRecord = Keypair.generate();

  // Instruction discriminator for create_payment (first 8 bytes)
  const discriminator = Buffer.from([0xc4, 0x51, 0xf3, 0x8e, 0xcc, 0x56, 0x4f, 0x1b]);

  // Encode the payment type (1 byte)
  const paymentTypeBuffer = Buffer.alloc(1);
  paymentTypeBuffer.writeUInt8(paymentType, 0);

  // Encode the amount (8 bytes, little-endian)
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(BigInt(amount), 0);

  // Combine instruction data
  const instructionData = Buffer.concat([
    discriminator,
    Buffer.from(merchant.toBuffer()),
    amountBuffer,
    paymentTypeBuffer,
  ]);

  const instruction = {
    programId: PAYMENT_ROUTER_PROGRAM_ID,
    keys: [
      { pubkey: user.publicKey, isSigner: true, isWritable: true },
      { pubkey: paymentRecord.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: instructionData,
  };

  const transaction = new Transaction().add(instruction);
  const signature = await sendAndConfirmTransaction(connection, transaction, [
    user,
    paymentRecord,
  ]);

  return signature;
}

/**
 * Confirm a payment record with execution reference
 */
export async function confirmPaymentRecord(
  connection: Connection,
  authority: Keypair,
  paymentRecordPubkey: PublicKey,
  executionReference: string
): Promise<string> {
  // Instruction discriminator for confirm_payment
  const discriminator = Buffer.from([0x2e, 0x97, 0xd8, 0x2c, 0x1b, 0x56, 0x41, 0xaa]);

  // Encode execution reference (4 bytes for length + string data)
  const referenceBuffer = Buffer.from(executionReference, "utf-8");
  const referenceLengthBuffer = Buffer.alloc(4);
  referenceLengthBuffer.writeUInt32LE(referenceBuffer.length, 0);

  // Combine instruction data
  const instructionData = Buffer.concat([
    discriminator,
    referenceLengthBuffer,
    referenceBuffer,
  ]);

  const instruction = {
    programId: PAYMENT_ROUTER_PROGRAM_ID,
    keys: [
      { pubkey: authority.publicKey, isSigner: true, isWritable: false },
      { pubkey: paymentRecordPubkey, isSigner: false, isWritable: true },
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
 * Derive the PDA for a payment record
 */
export function derivePaymentRecordPDA(
  user: PublicKey,
  merchant: PublicKey,
  seed: string
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("payment_record"),
      user.toBuffer(),
      merchant.toBuffer(),
      Buffer.from(seed),
    ],
    PAYMENT_ROUTER_PROGRAM_ID
  );
  return pda;
}

export default {
  createPaymentRecord,
  confirmPaymentRecord,
  derivePaymentRecordPDA,
  PaymentType,
  PaymentStatus,
  PAYMENT_ROUTER_PROGRAM_ID,
};
