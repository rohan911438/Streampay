"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletStatus() {
  const [mounted, setMounted] = useState(false);
  const { connected, publicKey, wallets } = useWallet();

  const hasDetectedWallet = useMemo(
    () =>
      wallets.some(
        (item) =>
          item.readyState === WalletReadyState.Installed ||
          item.readyState === WalletReadyState.Loadable
      ),
    [wallets]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const readyToRenderWalletState = mounted;

  const label = connected
    ? publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4)
    : readyToRenderWalletState
      ? hasDetectedWallet
        ? "Wallet not connected"
        : "No wallet detected"
      : "Checking wallet...";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wallet</p>
        <p className="text-sm font-medium text-slate-900">{label}</p>
      </div>
      {readyToRenderWalletState && (
        <WalletMultiButton
          className="!h-9 !rounded-md !bg-slate-900 !px-3 !text-sm !font-medium !text-white hover:!bg-slate-700"
        />
      )}
    </div>
  );
}