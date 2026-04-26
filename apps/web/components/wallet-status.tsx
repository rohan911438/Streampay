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
    : "Select Wallet";

  return (
    <div className={cn(
      "relative flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-300",
      connected 
        ? "border-emerald-100 bg-emerald-50/50" 
        : "border-slate-200 bg-white"
    )}>
      <div className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors shadow-sm",
        connected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {connected ? <ShieldCheck className="h-4 w-4" /> : <WalletIcon className="h-4 w-4" />}
      </div>
      
      <div className="hidden sm:block">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
          {connected ? "Identity Verified" : "Account"}
        </p>
        <p className="text-[11px] font-bold text-slate-900 tracking-tight leading-none">
          {readyToRenderWalletState ? addressLabel : "..."}
        </p>
      </div>

      <div className="relative ml-2">
        {mounted && (
          <WalletMultiButton
            className={cn(
              "!h-8 !rounded-lg !px-3 !text-[10px] !font-black !uppercase !tracking-widest !transition-all !border-none !shadow-none",
              connected 
                ? "!bg-transparent !text-emerald-600 hover:!bg-emerald-100/50" 
                : "!bg-slate-900 !text-white hover:!bg-slate-800"
            )}
          />
        )}
      </div>

      {readyToRenderWalletState && !connected && !hasDetectedWallet && (
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-white">
          <AlertCircle className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
}