"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";

export function WalletStatus() {
  const { connected, connecting, disconnect, connect, publicKey, wallet } = useWallet();

  const label = connected
    ? publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4)
    : wallet
      ? connecting
        ? "Connecting..."
        : "Connect Phantom"
      : "Install Phantom";

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

          if (wallet) {
            void connect();
          }
        }}
        disabled={!wallet && !connected}
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}