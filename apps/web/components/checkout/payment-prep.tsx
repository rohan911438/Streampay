"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
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
  const { connected, publicKey, wallets } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasDetectedWallet = useMemo(
    () =>
      wallets.some(
        (item) =>
          item.readyState === WalletReadyState.Installed ||
          item.readyState === WalletReadyState.Loadable
      ),
    [wallets]
  );

  const readyToRenderWalletState = mounted;

  const statusText = useMemo(() => {
    if (!readyToRenderWalletState) {
      return "Checking wallet...";
    }

    if (connected && publicKey) {
      return "Wallet connected";
    }

    if (!hasDetectedWallet) {
      return "No compatible wallet extension detected";
    }

    return "Wallet not connected";
  }, [connected, publicKey, hasDetectedWallet, readyToRenderWalletState]);

  const shortKey = useMemo(() => {
    if (!publicKey) {
      return null;
    }

    const base58 = publicKey.toBase58();
    return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
  }, [publicKey]);

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

          {!connected && readyToRenderWalletState && !hasDetectedWallet ? (
            <p className="mt-3 text-sm text-amber-700">
              No compatible Solana wallet extension detected. Install Phantom, Solflare, or Backpack,
              then refresh.
            </p>
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
          {readyToRenderWalletState && (
            <WalletMultiButton
              className="!h-10 !rounded-md !bg-slate-950 !px-4 !text-sm !font-medium !text-white hover:!bg-slate-800"
            />
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