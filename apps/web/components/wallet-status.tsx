"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { Button } from "@/components/ui/button";

export function WalletStatus() {
  const [mounted, setMounted] = useState(false);
  const [isPhantomInjected, setIsPhantomInjected] = useState(false);
  const { connected, connecting, disconnect, connect, publicKey, wallet, wallets, select } = useWallet();

  const phantomWallet = wallets.find((item) => item.adapter.name === "Phantom");
  const isPhantomInstalledByAdapter =
    phantomWallet?.readyState === WalletReadyState.Installed ||
    phantomWallet?.readyState === WalletReadyState.Loadable;

  useEffect(() => {
    setMounted(true);

    const updatePhantomPresence = () => {
      const provider = window.solana;
      const injected = Boolean(provider?.isPhantom || window.phantom?.solana?.isPhantom);
      setIsPhantomInjected(injected);
    };

    updatePhantomPresence();
    window.addEventListener("load", updatePhantomPresence);
    window.addEventListener("focus", updatePhantomPresence);

    return () => {
      window.removeEventListener("load", updatePhantomPresence);
      window.removeEventListener("focus", updatePhantomPresence);
    };
  }, []);

  const isPhantomAvailable = Boolean(phantomWallet) || isPhantomInjected || isPhantomInstalledByAdapter;
  const readyToRenderWalletState = mounted;

  async function onConnectClick() {
    if (!phantomWallet) {
      return;
    }

    if (!wallet || wallet.adapter.name !== phantomWallet.adapter.name) {
      select(phantomWallet.adapter.name);
    }

    try {
      await connect();
    } catch {
      // Connection errors are handled by wallet adapter internals; status remains visible in UI.
    }
  }

  const label = connected
    ? publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4)
    : readyToRenderWalletState
      ? isPhantomAvailable
        ? connecting
          ? "Connecting..."
          : "Connect Phantom"
        : "Wallet unavailable"
      : "Checking wallet...";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet</p>
        <p className="text-sm font-medium text-slate-900">{label}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          if (connected) {
            void disconnect();
            return;
          }

          void onConnectClick();
        }}
        disabled={connecting || !mounted}
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}