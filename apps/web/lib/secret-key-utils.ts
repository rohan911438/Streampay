import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

function tryDecodeBase64(value: string): Uint8Array | null {
  const normalized = value.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
    return null;
  }

  try {
    const buffer = Buffer.from(normalized, "base64");
    if (!buffer.length) {
      return null;
    }

    const roundTrip = Buffer.from(buffer).toString("base64").replace(/=+$/g, "");
    const input = normalized.replace(/=+$/g, "");
    if (roundTrip !== input) {
      return null;
    }

    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

function tryDecodeBase58(value: string): Uint8Array | null {
  try {
    const decoded = bs58.decode(value.trim());
    if (bs58.encode(decoded) !== value.trim()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function tryDecodeJsonArray(value: string): Uint8Array | null {
  if (!value.trim().startsWith("[") || !value.trim().endsWith("]")) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const bytes = Uint8Array.from(parsed.map((item) => Number(item)));
    if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
      return null;
    }

    return bytes;
  } catch {
    return null;
  }
}

export function normalizeSecretKeyInput(secretKeyInput: string | Uint8Array): Uint8Array {
  // Handle empty or placeholder values
  if (typeof secretKeyInput === "string") {
    const trimmed = secretKeyInput.trim();
    if (!trimmed || trimmed === "5K..." || trimmed.endsWith("...")) {
      throw new Error(
        "Secret key is not configured. Please set CLOAK_PRIVATE_PAYMENT_SIGNER_KEY to a valid base64/base58 encoded key."
      );
    }
  }

  if (secretKeyInput instanceof Uint8Array) {
    if (secretKeyInput.length === 64) {
      return secretKeyInput;
    }

    if (secretKeyInput.length === 32) {
      return Keypair.fromSeed(secretKeyInput).secretKey;
    }

    throw new Error(`Secret key must be 32 or 64 bytes, received ${secretKeyInput.length}`);
  }

  const candidates = [
    tryDecodeJsonArray(secretKeyInput),
    tryDecodeBase64(secretKeyInput),
    tryDecodeBase58(secretKeyInput),
  ].filter((candidate): candidate is Uint8Array => candidate !== null);

  for (const candidate of candidates) {
    if (candidate.length === 64) {
      return candidate;
    }

    if (candidate.length === 32) {
      return Keypair.fromSeed(candidate).secretKey;
    }
  }

  throw new Error(
    "Unable to decode secret key. Expected a 32-byte seed or 64-byte secret key encoded as base64, base58, JSON array, or raw Uint8Array."
  );
}

export function keypairFromSecretKeyInput(secretKeyInput: string | Uint8Array): Keypair {
  return Keypair.fromSecretKey(normalizeSecretKeyInput(secretKeyInput));
}
