"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Wallet as WalletIcon, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const addressLabel = connected
    ? publicKey?.toBase58().slice(0, 4) + "..." + publicKey?.toBase58().slice(-4)
    : "Not Connected";

  return (
    <div className={cn(
      "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500",
      connected 
        ? "border-emerald-100 bg-emerald-50/30" 
        : "border-slate-200 bg-white shadow-sm hover:shadow-md"
    )}>
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
        connected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {connected ? <ShieldCheck className="h-6 w-6" /> : <WalletIcon className="h-6 w-6" />}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Merchant Wallet</p>
          {connected && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </div>
        <p className="text-sm font-black text-slate-900 tracking-tight">
          {readyToRenderWalletState ? addressLabel : "Checking..."}
        </p>
      </div>

      <div className="relative">
        <WalletMultiButton
          className={cn(
            "!h-10 !rounded-xl !px-4 !text-xs !font-bold !uppercase !tracking-widest !transition-all",
            connected 
              ? "!bg-white !text-slate-900 !border !border-emerald-100 hover:!bg-emerald-50" 
              : "!bg-slate-900 !text-white hover:!bg-slate-800"
          )}
        />
      </div>

      {readyToRenderWalletState && !connected && !hasDetectedWallet && (
        <div className="absolute -bottom-2 right-4 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 border border-amber-100 shadow-sm">
          <AlertCircle className="h-3 w-3 text-amber-500" />
          <span className="text-[9px] font-bold text-amber-600 uppercase">No Wallet Found</span>
        </div>
      )}
    </div>
  );
}