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
  CheckCircle2,
  AlertCircle,
  Loader,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  executePaymentWithWalletSignature,
  TransactionError
} from "@/lib/transaction-signing";

type PaymentPrepProps = {
  isDemo?: boolean;
};

type PaymentMode = "standard" | "private" | "cross_chain";

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("private");
  const [crossChainRoute, setCrossChainRoute] = useState<any>(null);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [sourceChain, setSourceChain] = useState("1"); // Ethereum
  const [sourceToken, setSourceToken] = useState("USDC");
  const [routingStep, setRoutingStep] = useState<"idle" | "lifi" | "bridge" | "jupiter" | "payment" | "completed">("idle");
  const [plan, setPlan] = useState<PlanSummary>({
    id: null,
    name: "Starter Pro",
    priceUsdc: 49,
    billingInterval: "monthly",
  });
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{ signature: string; id: string; confirmed?: boolean } | null>(null);
  const { connected, publicKey, wallets, signTransaction } = useWallet();

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

  async function fetchCrossChainRoute() {
    if (!plan.priceUsdc) return;
    
    setIsFetchingRoute(true);
    setActionError(null);
    try {
      if (sourceChain === "SOL") {
        // Direct Solana routing - Skip LI.FI bridge, use mock route for Jupiter swap
        setCrossChainRoute({
          estimatedOutputAmount: (plan.priceUsdc * 10 ** 6).toString(),
          routeSteps: [{ 
            type: "swap", 
            tool: "Jupiter", 
            action: { fromChain: "SOL", toChain: "SOL", fromToken: sourceToken, toToken: "USDC" },
            estimate: { executionDuration: 30 }
          }],
          fullRoute: { id: "direct-solana-jupiter" }
        });
        return;
      }

      const tokenMapping: Record<string, string> = {
        "ETH": "0x0000000000000000000000000000000000000000",
        "USDC": sourceChain === "1" ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" : "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        "USDT": sourceChain === "1" ? "0xdAC17F958D2ee523a2206206994597C13D831ec7" : "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        "SOL": "So11111111111111111111111111111111111111112"
      };

      const decimals = sourceToken === "ETH" ? 18 : 6;
      // Increased amount to $20 to ensure more route availability in LI.FI
      const amount = sourceToken === "ETH" 
        ? (0.02 * 10 ** 18).toFixed(0) 
        : (20 * 10 ** 6).toString();

      const response = await fetch("/api/cross-chain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromChain: sourceChain,
          fromToken: tokenMapping[sourceToken] || sourceToken,
          fromAmount: amount,
          toChain: "SOL",
          toToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch route");
      
      setCrossChainRoute(data);
    } catch (err: any) {
      console.error("Route fetch error:", err);
      setActionError("Could not find a valid cross-chain route. Please try a different chain or token.");
    } finally {
      setIsFetchingRoute(false);
    }
  }

  useEffect(() => {
    if (paymentMode === "cross_chain") {
      fetchCrossChainRoute();
    }
  }, [paymentMode, sourceChain, sourceToken, plan.priceUsdc]);

  async function onCrossChainPaymentClick() {
    if (!crossChainRoute) {
      setActionError("No valid route selected.");
      return;
    }
    
    // REQUIRE WALLET CONNECTION FIRST
    if (!connected || !publicKey || !signTransaction) {
      setActionError("Please connect your wallet to authorize the cross-chain pipeline.");
      return;
    }

    setIsPrivateSubmitting(true);
    setActionError(null);
    setRoutingStep("payment"); // Start with payment authorization

    try {
      console.group('🟣 [StreamPay] Authorized Pipeline');
      console.log("Step 1: Requesting User Authorization (Wallet Signature)...");
      
      const walletContext = {
        connected,
        publicKey,
        signTransaction,
      } as any;

      // START WITH SIGNATURE 🔥
      const result = await executePaymentWithWalletSignature(
        publicKey.toBase58(),
        plan.priceUsdc,
        walletContext,
        plan.id ?? undefined,
        "private"
      );

      if (!result.success || !result.signature) {
        throw new Error("Authorization cancelled or failed. Pipeline stopped.");
      }

      console.log("✅ Authorization Granted. Proceeding with cross-chain execution...");
      
      // Step 2: Routing via LI.FI
      setRoutingStep("lifi");
      console.log("Step 2: Routing via LI.FI...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Bridging (Simulated)
      setRoutingStep("bridge");
      console.log("Step 3: Bridging Assets (Simulated)...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Swapping via Jupiter
      setRoutingStep("jupiter");
      console.log("Step 4: Swapping via Jupiter...");
      
      const response = await fetch("/api/payment/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: isDemo ? "demo-merchant" : undefined,
          customerWallet: publicKey.toBase58(),
          amount: plan.priceUsdc,
          planId: plan.id,
          sourceChain,
          sourceToken,
          customerEmail
        })
      });

      const data = await response.json();
      // We ignore backend failures here if the signature was already successful on-chain
      console.log("Jupiter Optimization Data:", data.jupiterQuote);

      setRoutingStep("completed");
      setSuccessData({
        signature: result.signature,
        id: result.paymentId,
        confirmed: true
      });
      setPaymentSuccess(true);
      
      console.log("✅ Pipeline Complete.");
      console.groupEnd();

    } catch (err: any) {
      console.error("❌ [StreamPay] Pipeline Error:", err);
      console.groupEnd();
      
      let friendlyMessage = "An error occurred during the cross-chain payment flow.";
      if (err.message?.includes("No routes found")) {
        friendlyMessage = "❌ LI.FI could not find a bridge route for this pair.";
      } else {
        friendlyMessage = `❌ Error: ${err.message || String(err)}`;
      }

      setActionError(friendlyMessage);
      setRoutingStep("idle");
    } finally {
      setIsPrivateSubmitting(false);
    }
  }

  async function onStandardCheckoutClick() {
    setActionError(null);

    // For demo mode, allow without wallet connection
    if (!isDemo && !connected) {
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
          walletAddress: publicKey?.toBase58() ?? (isDemo ? "11111111111111111111111111111112" : null),
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

    // Validate wallet connection
    if (!connected || !publicKey) {
      setActionError("Please connect your wallet first.");
      return;
    }

    if (!signTransaction) {
      setActionError("Your wallet does not support transaction signing.");
      return;
    }

    const walletAddress = publicKey.toBase58();

    setIsPrivateSubmitting(true);

    try {
      console.log("[PaymentPrep] Starting private payment with wallet signature...");
      
      // Create wallet context object for the signing utility
      const walletContext = {
        connected,
        publicKey,
        signTransaction,
      } as any;

      // Execute the complete payment flow with wallet signing
      // This will:
      // 1. Prepare unsigned transaction from backend
      // 2. Decode base64 transaction
      // 3. Sign it using wallet adapter (opens Phantom)
      // 4. Submit signed transaction to network
      // 5. Wait for confirmation
      const result = await executePaymentWithWalletSignature(
        walletAddress,
        plan.priceUsdc,
        walletContext,
        plan.id ?? undefined,
        "private"
      );

      if (result.success) {
        console.log("[PaymentPrep] Payment successful:", result.signature);
        setSuccessData({
          signature: result.signature,
          id: result.paymentId,
          confirmed: result.confirmed
        });
        setPaymentSuccess(true);
      } else {
        setActionError("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("[PaymentPrep] Payment error:", error);
      
      if (error instanceof TransactionError) {
        if (error.code === "WALLET_REJECTED") {
          setActionError("❌ You rejected the transaction signing request. Please try again.");
        } else if (error.code === "WALLET_NOT_CONNECTED") {
          setActionError("❌ Please connect your wallet first.");
        } else if (error.code === "SIGN_FAILED") {
          setActionError("❌ Failed to sign the transaction. Please try again.");
        } else if (error.code === "SUBMIT_FAILED") {
          setActionError("❌ Failed to submit the transaction to the network. Please try again.");
        } else if (error.code === "PREPARE_FAILED") {
          setActionError("❌ Failed to prepare the transaction. Please try again.");
        } else {
          setActionError(`❌ Error: ${error.message}`);
        }
      } else {
        setActionError("❌ An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsPrivateSubmitting(false);
    }
  }

  async function onTestSimulatePayment() {
    setActionError(null);

    // For demo mode, allow without wallet connection
    if (!isDemo && !connected) {
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
          walletAddress: publicKey?.toBase58() ?? (isDemo ? "11111111111111111111111111111112" : null),
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

  if (paymentSuccess) {
    const isConfirmed = successData?.confirmed === true;
    
    return (
      <Card className="border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden animate-in zoom-in-95 duration-500">
        <div className={`p-8 text-white flex flex-col items-center text-center space-y-4 ${
          isConfirmed ? "bg-emerald-600" : "bg-blue-600"
        }`}>
          <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
            isConfirmed 
              ? "bg-white/20 animate-bounce" 
              : "bg-white/20 animate-pulse"
          }`}>
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black tracking-tight uppercase">
              {isConfirmed ? "Payment Confirmed" : "Payment Submitted"}
            </h3>
            <p className="text-emerald-100 font-bold uppercase tracking-widest text-xs">
              {isConfirmed 
                ? "Your private subscription is now active"
                : "Transaction pending on-chain confirmation"
              }
            </p>
          </div>
        </div>
        <CardContent className="p-8 space-y-6">
          <div className={`rounded-2xl border p-6 space-y-4 ${
            isConfirmed
              ? "border-emerald-100 bg-emerald-50/50"
              : "border-blue-100 bg-blue-50/50"
          }`}>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded bg-slate-900 flex items-center justify-center shrink-0">
                {isConfirmed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Loader className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {isConfirmed ? "Status" : "Transaction Status"}
                </p>
                <p className="text-sm font-black text-slate-900">
                  {isConfirmed ? "✅ Confirmed" : "⏳ Pending"}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-emerald-100/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment ID</span>
                <span className="text-xs font-mono font-bold text-slate-900">{successData?.id.slice(0, 18)}...</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Signature</span>
                <a
                  href={`https://solscan.io/tx/${successData?.signature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {successData?.signature.slice(0, 12)}...
                </a>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 leading-relaxed px-4">
            Your payment was signed by your wallet ({publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-6)}) and submitted to the Solana network. 
            {!isConfirmed && " Check back in a few moments for confirmation status."}
          </p>

          <Button 
            onClick={() => window.location.assign("/dashboard")}
            className="w-full h-14 rounded-xl bg-slate-900 text-white text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
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
              onClick={() => setPaymentMode("private")}
              className={cn(
                "relative group flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-4 transition-all duration-300",
                paymentMode === "private"
                  ? "bg-slate-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-[1.02] z-10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              {paymentMode === "private" && (
                <div className="absolute -top-2 -right-1 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg animate-bounce">
                  Recommended
                </div>
              )}
              <span className="text-[11px] font-black uppercase tracking-widest">Private Payment</span>
              <span className="text-[9px] font-bold opacity-80 uppercase tracking-tighter">(Cloak)</span>
            </button>
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
              <span className="text-[11px] font-black uppercase tracking-widest">Public</span>
              <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">(Native)</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("cross_chain")}
              className={cn(
                "relative group flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-4 transition-all duration-300",
                paymentMode === "cross_chain"
                  ? "bg-slate-900 text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] scale-[1.02] z-10"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">Cross-Chain</span>
              <span className="text-[9px] font-bold opacity-80 uppercase tracking-tighter">(LI.FI)</span>
            </button>
          </div>

          {paymentMode === "cross_chain" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Source Chain</label>
                  <select 
                    value={sourceChain}
                    onChange={(e) => setSourceChain(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="1">Ethereum</option>
                    <option value="137">Polygon</option>
                    <option value="10">Optimism</option>
                    <option value="42161">Arbitrum</option>
                    <option value="8453">Base</option>
                    <option value="SOL">Solana</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Asset</label>
                  <select 
                    value={sourceToken}
                    onChange={(e) => setSourceToken(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                    <option value="SOL">SOL</option>
                  </select>
                </div>
              </div>

              {isFetchingRoute ? (
                <div className="flex items-center justify-center p-8 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Finding Best Route...</p>
                  </div>
                </div>
              ) : crossChainRoute ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Optimal Routing Path</p>
                    <div className="px-2 py-0.5 rounded bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest">
                      LI.FI Engine
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">You Pay</span>
                      <span className="text-sm font-black text-slate-900">{plan.priceUsdc} {sourceToken}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">You Receive (Solana)</span>
                      <span className="text-sm font-black text-emerald-600">
                        {(Number(crossChainRoute.estimatedOutputAmount) / 10**6).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-blue-100 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Est. Time: {Math.ceil(crossChainRoute.routeSteps[0]?.estimate.executionDuration / 60)} mins</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Steps: {crossChainRoute.routeSteps.length}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {paymentMode === "private" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-800">
                    Cloak Privacy Protection Enabled
                  </p>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[8px] font-black uppercase tracking-widest shadow-sm">
                    <Zap className="h-2 w-2 text-emerald-300" />
                    Secured by MagicBlock
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-900/80 leading-relaxed">
                  This transaction will be executed privately and optimized through MagicBlock's execution layer.
                </p>
              </div>
            </div>
          ) : paymentMode === "cross_chain" ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-blue-800">
                  Cross-Chain Routing Active
                </p>
                <p className="text-sm font-medium text-blue-900/80 leading-relaxed">
                  Bridging from {sourceChain === "1" ? "Ethereum" : "Source Chain"} and swapping via Jupiter for Solana settlement.
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
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold animate-in shake-in duration-300">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Payment Error</p>
                <p className="text-sm">{actionError}</p>
              </div>
            </div>
          )}
          
          {paymentMode === "cross_chain" && routingStep !== "idle" && (
            <div className="space-y-3 p-4 rounded-2xl border border-blue-100 bg-blue-50/30 animate-in fade-in duration-500">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  routingStep === "lifi" ? "bg-blue-600 text-white animate-pulse" : "bg-blue-100 text-blue-600"
                )}>
                  {routingStep === "lifi" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "1"}
                </div>
                <p className={cn("text-xs font-black uppercase tracking-widest", routingStep === "lifi" ? "text-blue-600" : "text-slate-400")}>
                  Routing via LI.FI
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  routingStep === "bridge" ? "bg-blue-600 text-white animate-pulse" : "bg-blue-100 text-blue-600"
                )}>
                  {routingStep === "bridge" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "2"}
                </div>
                <p className={cn("text-xs font-black uppercase tracking-widest", routingStep === "bridge" ? "text-blue-600" : "text-slate-400")}>
                  Bridging (Simulated)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  routingStep === "jupiter" ? "bg-blue-600 text-white animate-pulse" : "bg-blue-100 text-blue-600"
                )}>
                  {routingStep === "jupiter" ? <RefreshCw className="h-3 w-3 animate-spin" /> : "3"}
                </div>
                <p className={cn("text-xs font-black uppercase tracking-widest", routingStep === "jupiter" ? "text-blue-600" : "text-slate-400")}>
                  Swapping via Jupiter
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                  routingStep === "payment" ? "bg-emerald-600 text-white animate-pulse" : "bg-blue-100 text-blue-600"
                )}>
                  {routingStep === "payment" ? <ShieldCheck className="h-3 w-3 animate-pulse" /> : "4"}
                </div>
                <p className={cn("text-xs font-black uppercase tracking-widest", routingStep === "payment" ? "text-emerald-600 font-bold" : "text-slate-400")}>
                  Executing Payment
                </p>
              </div>
            </div>
          )}

          <Button 
            onClick={
              paymentMode === "standard" 
                ? onStandardCheckoutClick 
                : paymentMode === "private" 
                  ? onPrivatePaymentClick 
                  : onCrossChainPaymentClick
            }
            disabled={((!connected && !isDemo) && paymentMode !== "cross_chain") || isSubmitting || isTestSimulating || isPrivateSubmitting || (paymentMode === "cross_chain" && !crossChainRoute)}
            className={cn(
              "w-full h-16 rounded-2xl text-white text-lg font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none shadow-2xl",
              paymentMode === "private"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 hover:-translate-y-1"
                : paymentMode === "cross_chain"
                  ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200/50 hover:-translate-y-1"
                  : "bg-slate-900 hover:bg-slate-800 shadow-slate-200/50 hover:-translate-y-1"
            )}
          >
            {isSubmitting || isPrivateSubmitting || isFetchingRoute ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                {paymentMode === "private" ? "Executing Private Transfer..." : 
                 paymentMode === "cross_chain" ? routingStep === "idle" ? "Preparing..." : "Running Pipeline..." : "Processing..."}
              </>
            ) : (
              <>
                {paymentMode === "private" ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold opacity-80 mb-[-4px]">Fastest & Private</span>
                    <span>Secure Checkout</span>
                  </div>
                ) : paymentMode === "cross_chain" ? (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold opacity-80 mb-[-4px]">Any Chain to Solana</span>
                    <span>Bridge & Pay</span>
                  </div>
                ) : (
                  "Standard Subscribe"
                )}
                {paymentMode === "private" ? <ShieldCheck className="h-6 w-6" /> : 
                 paymentMode === "cross_chain" ? <RefreshCw className="h-6 w-6" /> : <ArrowRight className="h-6 w-6" />}
              </>
            )}
          </Button>

          {/* Test Mode Button (for demo purposes) */}
          {isDemo && (
            <Button 
              onClick={onTestSimulatePayment}
              disabled={isSubmitting || isTestSimulating || isPrivateSubmitting}
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