"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PaymentPrep() {
  const [actionError, setActionError] = useState<string | null>(null);
  const { connected, connecting, disconnect, connect, publicKey, wallet } = useWallet();

  const statusText = useMemo(() => {
    if (connecting) {
      return "Connecting wallet...";
    }

    if (connected && publicKey) {
      return "Wallet connected";
    }

    if (!wallet) {
      return "Phantom not detected";
    }

    return "Wallet not connected";
  }, [connected, connecting, publicKey, wallet]);

  const shortKey = useMemo(() => {
    if (!publicKey) {
      return null;
    }

    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  async function onConnectClick() {
    setActionError(null);

    if (!wallet) {
      setActionError("Install Phantom to continue.");
      return;
    }

    try {
      await connect();
    } catch {
      setActionError("Wallet connection was not completed.");
    }
  }

  async function onDisconnectClick() {
    setActionError(null);

    try {
      await disconnect();
    } catch {
      setActionError("Unable to disconnect wallet right now.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Step 1</CardDescription>
        <CardTitle>Connect wallet to continue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Connection status</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{statusText}</p>

          {connected && publicKey ? (
            <div className="mt-3 space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Public key</p>
              <p className="break-all font-mono text-sm text-slate-900">{publicKey.toBase58()}</p>
              <p className="text-xs text-slate-500">Short key: {shortKey}</p>
            </div>
          ) : null}

          {actionError ? <p className="mt-3 text-sm text-red-600">{actionError}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3">
          {connected ? (
            <Button type="button" variant="secondary" onClick={() => void onDisconnectClick()}>
              Disconnect
            </Button>
          ) : (
            <Button type="button" onClick={() => void onConnectClick()} disabled={connecting}>
              {connecting ? "Connecting..." : "Connect Phantom"}
            </Button>
          )}

          <Button type="button" disabled={!connected}>
            Pay
          </Button>
        </div>

        <p className="text-sm text-slate-600">
          The Pay button is intentionally a placeholder in this step. Transaction sending will be
          added next.
        </p>
      </CardContent>
    </Card>
  );
}