"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SimulationStatus = "idle" | "simulating" | "success" | "error";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SimulationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [shouldSimulate, setShouldSimulate] = useState(false);

  const subscriptionId = searchParams.get("subscription_id");
  const checkoutSessionId = searchParams.get("checkout_session_id");
  const isTestMode = searchParams.get("test") === "true";
  const isPrivatePayment = searchParams.get("private") === "true";
  const transactionSignature = searchParams.get("transaction_signature");

  useEffect(() => {
    if (isTestMode && (subscriptionId || checkoutSessionId)) {
      setShouldSimulate(true);
    }
  }, [isTestMode, subscriptionId, checkoutSessionId]);

  useEffect(() => {
    if (!shouldSimulate || status !== "idle") return;

    const simulatePayment = async () => {
      setStatus("simulating");
      setError(null);

      try {
        const params = new URLSearchParams();
        if (subscriptionId) params.append("subscriptionId", subscriptionId);
        if (checkoutSessionId) params.append("checkoutSessionId", checkoutSessionId);

        const response = await fetch(
          `/api/testing/simulate-payment?${params.toString()}`,
          { method: "POST" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Payment simulation failed");
        }

        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("error");
      }
    };

    simulatePayment();
  }, [shouldSimulate, status, subscriptionId, checkoutSessionId]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
          {isPrivatePayment ? "Private Payment" : "Payment"} <span className="text-primary">Received</span>
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {isTestMode
            ? "Testing Mode - Simulation Active"
            : isPrivatePayment
              ? "Cloak Private Transfer Complete"
              : "Transaction Complete"}
        </p>
      </div>

      <Card className="border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden max-w-2xl mx-auto">
        <CardContent className="p-12 space-y-8">
          {/* Status Indicator */}
          <div className="flex justify-center">
            {status === "simulating" && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center animate-spin">
                  <Loader className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  {isTestMode
                    ? "Simulating payment in database..."
                    : "Processing your payment..."}
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-black text-slate-900">
                    {isTestMode ? "Payment Simulated" : isPrivatePayment ? "Private Payment Successful" : "Payment Successful"}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {isTestMode
                      ? "Subscription activated for testing"
                      : isPrivatePayment
                        ? "Your subscription is now active through Cloak"
                        : "Your subscription is now active"}
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-black text-slate-900">Error</p>
                  <p className="text-sm font-semibold text-red-600">{error}</p>
                </div>
              </div>
            )}

            {status === "idle" && !isTestMode && (
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Payment confirmation received
                </p>
              </div>
            )}
          </div>

          {/* Details */}
          {status === "success" && (
            <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Subscription Details
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Status</span>
                    <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                  {subscriptionId && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Subscription ID</span>
                      <code className="text-[10px] font-mono text-slate-500 break-all">
                        {subscriptionId}
                      </code>
                    </div>
                  )}
                  {isPrivatePayment && transactionSignature && (
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-semibold text-slate-600">Cloak Transaction</span>
                      <code className="text-[10px] font-mono text-slate-500 break-all text-right">
                        {transactionSignature}
                      </code>
                    </div>
                  )}
                  {isTestMode && (
                    <div className="pt-2 border-t border-slate-200 mt-2">
                      <p className="text-[10px] text-slate-400 italic">
                        ℹ️ This payment was simulated using the testing API. Replace with real
                        webhook integration in production.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/dashboard">
              <Button className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200">
                Go to Dashboard
              </Button>
            </Link>

            {status === "error" && (
              <div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  className="w-full h-12 rounded-xl text-sm font-black uppercase tracking-widest"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Testing Info Box */}
      {isTestMode && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">
            ⚠️ Testing Mode
          </p>
          <p className="text-xs text-blue-700">
            This page used the temporary payment simulation API to update your subscription status in
            the database. In production, this will be replaced with real Dodo webhook notifications.
          </p>
        </div>
      )}

      {isPrivatePayment && !isTestMode && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
            Cloak Private Payment
          </p>
          <p className="text-xs text-emerald-700">
            This subscription was activated through the private Cloak payment flow, with the transaction recorded separately from the standard checkout path.
          </p>
        </div>
      )}
    </div>
  );
}
