"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentPrepProps = {
  isDemo?: boolean;
};

type CreateCheckoutResponse = {
  checkout_url?: string;
  error?: string;
};

export function PaymentPrep({ isDemo = false }: PaymentPrepProps) {
  const [mounted, setMounted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("Demo Subscriber");
  const [customerEmail, setCustomerEmail] = useState("demo@paystream.app");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhantomInjected, setIsPhantomInjected] = useState(false);
  const { connected, connecting, disconnect, connect, publicKey, wallet, wallets, select } = useWallet();

  const phantomWallet = useMemo(
    () => wallets.find((item) => item.adapter.name === "Phantom"),
    [wallets]
  );

  const isPhantomInstalled =
    phantomWallet?.readyState === WalletReadyState.Installed ||
    phantomWallet?.readyState === WalletReadyState.Loadable;

  useEffect(() => {
    setMounted(true);

    const updatePhantomPresence = () => {
      const provider = window.solana;
      setIsPhantomInjected(Boolean(provider?.isPhantom || window.phantom?.solana?.isPhantom));
    };

    updatePhantomPresence();
    window.addEventListener("load", updatePhantomPresence);
    window.addEventListener("focus", updatePhantomPresence);

    const intervalId = window.setInterval(updatePhantomPresence, 1000);

    return () => {
      window.removeEventListener("load", updatePhantomPresence);
      window.removeEventListener("focus", updatePhantomPresence);
      window.clearInterval(intervalId);
    };
  }, []);

  const hasPhantom = Boolean(phantomWallet) || isPhantomInjected || isPhantomInstalled;
  const readyToRenderWalletState = mounted;

  const statusText = useMemo(() => {
    if (!readyToRenderWalletState) {
      return "Checking wallet...";
    }

    if (connecting) {
      return "Connecting wallet...";
    }

    if (connected && publicKey) {
      return "Wallet connected";
    }

    if (!hasPhantom) {
      return "Phantom not detected";
    }

    return "Wallet not connected";
  }, [connected, connecting, publicKey, hasPhantom, readyToRenderWalletState]);

  const shortKey = useMemo(() => {
    if (!publicKey) {
      return null;
    }

    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

  async function onConnectClick() {
    setActionError(null);

    if (!phantomWallet) {
      setActionError("Phantom wallet adapter is unavailable in this browser.");
      return;
    }

    if (!wallet || wallet.adapter.name !== phantomWallet.adapter.name) {
      select(phantomWallet.adapter.name);
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

  async function onCheckoutClick() {
    setActionError(null);

    if (!connected) {
      setActionError("Connect your wallet before continuing.");
      return;
    }

    if (!customerName.trim()) {
      setActionError("Please enter your name.");
      return;
    }

    if (!customerEmail.trim()) {
      setActionError("Please enter your email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerName.trim(),
          email: customerEmail.trim(),
        }),
      });

      const data = (await response.json()) as CreateCheckoutResponse;

      if (!response.ok || !data.checkout_url) {
        setActionError(data.error ?? "Unable to create checkout session. Try again.");
        return;
      }

      window.location.assign(data.checkout_url);
    } catch {
      setActionError("Checkout request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Name</span>
            <input
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
              placeholder="Subscriber name"
              disabled={isSubmitting}
              autoComplete="name"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</span>
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
              placeholder="subscriber@example.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          {connected ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onDisconnectClick()}
              disabled={isSubmitting}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void onConnectClick()}
              disabled={connecting || isSubmitting || !mounted}
            >
              {connecting ? "Connecting..." : "Connect Phantom"}
            </Button>
          )}

          <Button type="button" disabled={!connected || isSubmitting} onClick={() => void onCheckoutClick()}>
            {isSubmitting ? "Redirecting..." : isDemo ? "Subscribe" : "Pay"}
          </Button>
        </div>

        <p className="text-sm text-slate-600">
          Checkout is securely created by the backend, then you are redirected to Dodo's hosted
          checkout page.
        </p>
      </CardContent>
    </Card>
  );
}