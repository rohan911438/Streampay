"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Wallet, 
  ArrowRight, 
  Info,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const [customerName, setCustomerName] = useState("Demo User");
  const [customerEmail, setCustomerEmail] = useState("demo@example.com");
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

  const addressLabel = connected
    ? publicKey?.toBase58().slice(0, 6) + "..." + publicKey?.toBase58().slice(-6)
    : "Wallet not connected";

  async function onCheckoutClick() {
    setActionError(null);

    if (!connected) {
      setActionError("Please connect your wallet first.");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      setActionError("Please provide your contact details.");
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
          walletAddress: publicKey?.toBase58() ?? null,
        }),
      });

      const data = (await response.json()) as CreateCheckoutResponse;

      if (!response.ok || !data.checkout_url) {
        setActionError(data.error ?? "Checkout creation failed. Please try again.");
        return;
      }

      window.location.assign(data.checkout_url);
    } catch {
      setActionError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Plan Header */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">
            Selected Plan
          </div>
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-black tracking-tight uppercase">Starter Pro</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tighter">$49.00</span>
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">/ Month</span>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-8">
        {/* Wallet Section */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
          connected ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-slate-50/30"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
              connected ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
            )}>
              {connected ? <ShieldCheck className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connection Status</p>
              <p className="text-xs font-black text-slate-900 tracking-tight">
                {readyToRenderWalletState ? addressLabel : "Initializing..."}
              </p>
            </div>
          </div>
          {readyToRenderWalletState && (
            <WalletMultiButton 
              className={cn(
                "!h-9 !rounded-lg !px-4 !text-[10px] !font-bold !uppercase !tracking-widest !transition-all",
                connected 
                  ? "!bg-white !text-slate-900 !border !border-emerald-100 hover:!bg-emerald-100" 
                  : "!bg-slate-900 !text-white hover:!bg-slate-800"
              )}
            />
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
              <input 
                type="text" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-4 pt-2">
          {actionError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
              <Info className="h-4 w-4" />
              {actionError}
            </div>
          )}
          
          <Button 
            onClick={onCheckoutClick}
            disabled={!connected || isSubmitting}
            className="w-full h-16 rounded-2xl bg-slate-900 text-white text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Subscribe Now
                <ArrowRight className="h-6 w-6" />
              </>
            )}
          </Button>
          
          <div className="flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Automatic monthly renewals on-chain
             </div>
             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
                Secure checkout powered by Dodo Payments
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Separate component for RefreshCw to avoid build error
function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}