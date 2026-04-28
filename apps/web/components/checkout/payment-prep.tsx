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

type PaymentMode = "standard" | "private";

type PlanSummary = {
  id: string | null;
  name: string;
  priceUsdc: number;
  billingInterval: "monthly" | "yearly";
};

type CreateCheckoutResponse = {
  checkout_url?: string;
  subscription_id?: string;
  checkout_session_id?: string;
  error?: string;
};

type CloakPayResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  subscriptionId?: string;
  transactionSignature?: string;
  transactionReference?: string;
  status?: string;
  paymentMethod?: string;
};

export function PaymentPrep({ isDemo = false }: PaymentPrepProps) {
  const [mounted, setMounted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("Demo User");
  const [customerEmail, setCustomerEmail] = useState("demo@example.com");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivateSubmitting, setIsPrivateSubmitting] = useState(false);
  const [isTestSimulating, setIsTestSimulating] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("standard");
  const [plan, setPlan] = useState<PlanSummary>({
    id: null,
    name: "Starter Pro",
    priceUsdc: 49,
    billingInterval: "monthly",
  });
  const { connected, publicKey, wallets } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const response = await fetch("/api/plans", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          plans?: Array<{
            id: string;
            name: string;
            priceUsdc: number;
            billingInterval: "monthly" | "yearly";
            active?: boolean;
          }>;
        };

        const selectedPlan = payload.plans?.find((item) => item.active) ?? payload.plans?.[0];

        if (!cancelled && selectedPlan) {
          setPlan({
            id: selectedPlan.id,
            name: selectedPlan.name,
            priceUsdc: Number(selectedPlan.priceUsdc) || 49,
            billingInterval: selectedPlan.billingInterval,
          });
        }
      } catch {
        // Keep the demo fallback values when the plans API is unavailable.
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
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

  const priceLabel = `$${plan.priceUsdc.toFixed(2)}`;
  const intervalLabel = plan.billingInterval === "yearly" ? "/ Year" : "/ Month";

  async function onStandardCheckoutClick() {
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

  async function onPrivatePaymentClick() {
    setActionError(null);

    if (!connected || !publicKey) {
      setActionError("Please connect your wallet first.");
      return;
    }

    setIsPrivateSubmitting(true);

    try {
      const response = await fetch("/api/cloak/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          amount: plan.priceUsdc,
        }),
      });

      const data = (await response.json()) as CloakPayResponse;

      if (!response.ok || !data.success) {
        setActionError(data.message ?? data.error ?? "Private payment failed. Please try again.");
        return;
      }

      const params = new URLSearchParams({
        private: "true",
        subscription_id: data.subscriptionId ?? "",
      });

      if (data.transactionSignature) {
        params.append("transaction_signature", data.transactionSignature);
      }

      window.location.assign(`/pay/success?${params.toString()}`);
    } catch {
      setActionError("A network error occurred. Please try again.");
    } finally {
      setIsPrivateSubmitting(false);
    }
  }

  async function onTestSimulatePayment() {
    setActionError(null);

    if (!connected) {
      setActionError("Please connect your wallet first.");
      return;
    }

    setIsTestSimulating(true);

    try {
      const response = await fetch("/api/dodo/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customerName.trim() || "Test User",
          email: customerEmail.trim() || "test@example.com",
          walletAddress: publicKey?.toBase58() ?? null,
        }),
      });

      const data = (await response.json()) as CreateCheckoutResponse;

      if (!response.ok) {
        setActionError(data.error ?? "Failed to initialize subscription.");
        return;
      }

      // Redirect to success page with test mode enabled and subscription details
      const params = new URLSearchParams({
        test: "true",
      });

      if (data.subscription_id) {
        params.append("subscription_id", data.subscription_id);
      }

      if (data.checkout_session_id) {
        params.append("checkout_session_id", data.checkout_session_id);
      }

      window.location.assign(`/pay/success?${params.toString()}`);
    } catch {
      setActionError("A network error occurred. Please try again.");
    } finally {
      setIsTestSimulating(false);
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
          <h3 className="text-3xl font-black tracking-tight uppercase">{plan.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tracking-tighter">{priceLabel}</span>
            <span className="text-sm font-bold text-white/40 uppercase tracking-widest">{intervalLabel}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-8 space-y-8">
        {/* Payment Mode Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transaction Privacy</p>
              <p className="text-sm font-black text-slate-900 tracking-tight">
                Select your preferred payment method.
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all",
              paymentMode === "private"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              {paymentMode === "private" ? <ShieldCheck className="h-3.5 w-3.5 animate-pulse" /> : <CreditCard className="h-3.5 w-3.5" />}
              {paymentMode === "private" ? "Cloak Protected" : "Public Transfer"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-[22px] bg-slate-100/50 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setPaymentMode("standard")}
              className={cn(
                "relative group flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-4 transition-all duration-300",
                paymentMode === "standard"
                  ? "bg-white text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-200"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">Public Payment</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">(Standard)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("private")}
              className={cn(
                "relative group flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-4 transition-all duration-300",
                paymentMode === "private"
                  ? "bg-slate-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-[1.02] z-10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              {paymentMode !== "private" && (
                <div className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                  Secure
                </div>
              )}
              <span className="text-[11px] font-black uppercase tracking-widest">Private Payment</span>
              <span className="text-[9px] font-bold opacity-80 uppercase tracking-tighter">(Cloak)</span>
            </button>
          </div>

          {paymentMode === "private" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-800">
                  Cloak Privacy Protection Enabled
                </p>
                <p className="text-sm font-medium text-emerald-900/80 leading-relaxed">
                  This transaction will be executed privately. Details such as the amount and recipient will not be visible on-chain.
                </p>
              </div>
            </div>
          ) : (
             <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5 text-slate-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Standard On-Chain Transaction
                </p>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Your transaction will be recorded on the public ledger as a standard USDC transfer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Section */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
          connected 
            ? paymentMode === "private" 
              ? "border-emerald-200 bg-emerald-50/30" 
              : "border-emerald-100 bg-emerald-50/50" 
            : "border-slate-100 bg-slate-50/30"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
              connected 
                ? paymentMode === "private" 
                  ? "bg-slate-900 text-emerald-400" 
                  : "bg-emerald-500 text-white" 
                : "bg-slate-200 text-slate-400"
            )}>
              {connected ? <ShieldCheck className={cn("h-5 w-5", paymentMode === "private" && "animate-pulse")} /> : <Wallet className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Connected Identity</p>
              <p className="text-xs font-black text-slate-900 tracking-tight">
                {readyToRenderWalletState ? addressLabel : "Initializing..."}
              </p>
            </div>
          </div>
          {readyToRenderWalletState && (
            <WalletMultiButton 
              className={cn(
                "!h-9 !rounded-lg !px-4 !text-[10px] !font-bold !uppercase !tracking-widest !transition-all shadow-sm",
                connected 
                  ? "!bg-white !text-slate-900 !border !border-slate-200 hover:!bg-slate-50" 
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
                disabled={isSubmitting || isPrivateSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                disabled={isSubmitting || isPrivateSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="space-y-4 pt-2">
          {actionError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold animate-in shake-in duration-300">
              <Info className="h-4 w-4" />
              {actionError}
            </div>
          )}
          
          <Button 
            onClick={paymentMode === "standard" ? onStandardCheckoutClick : onPrivatePaymentClick}
            disabled={!connected || isSubmitting || isTestSimulating || isPrivateSubmitting}
            className={cn(
              "w-full h-16 rounded-2xl text-white text-lg font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none shadow-2xl",
              paymentMode === "private"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 hover:-translate-y-1"
                : "bg-slate-900 hover:bg-slate-800 shadow-slate-200/50 hover:-translate-y-1"
            )}
          >
            {isSubmitting || isPrivateSubmitting ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                {paymentMode === "private" ? "Securing Privacy..." : "Processing..."}
              </>
            ) : (
              <>
                {paymentMode === "private" ? "Pay Privately with Cloak" : "Subscribe Now"}
                {paymentMode === "private" ? <ShieldCheck className="h-6 w-6" /> : <ArrowRight className="h-6 w-6" />}
              </>
            )}
          </Button>

          {/* Test Mode Button (for demo purposes) */}
          {isDemo && (
            <Button 
              onClick={onTestSimulatePayment}
              disabled={!connected || isSubmitting || isTestSimulating || isPrivateSubmitting}
              variant="secondary"
              className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
            >
              {isTestSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Simulating...
                </>
              ) : (
                "🧪 Test Payment (Demo)"
              )}
            </Button>
          )}
          
          <div className="flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
               {paymentMode === "private" ? "Private payment processed through Cloak" : "Automatic monthly renewals on-chain"}
             </div>
             <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-300">
               {paymentMode === "private" ? "Protected by Cloak private transfer flow" : "Secure checkout powered by Dodo Payments"}
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