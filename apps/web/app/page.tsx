"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  ArrowRight,
  Wallet,
  Zap,
  Shield,
  BarChart3,
  RefreshCw,
  Globe,
  CheckCircle2,
  CreditCard,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Components ---

const MockDashboard = () => (
  <div className="relative w-full max-w-lg mx-auto">
    {/* Main Card */}
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Merchant Analytics</h4>
            <p className="text-xs text-muted-foreground">Real-time revenue</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
          +12.5%
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Total Revenue</p>
          <h3 className="text-3xl font-bold">12,450.80 <span className="text-lg font-medium text-muted-foreground">USDC</span></h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Subs</p>
            <p className="text-lg font-bold">142</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 border border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Churn Rate</p>
            <p className="text-lg font-bold">0.8%</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold">Recent Transactions</p>
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-primary/5 flex items-center justify-center">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="text-[11px]">
                  <p className="font-semibold">Subscription Payment</p>
                  <p className="text-muted-foreground">user_82..k4</p>
                </div>
              </div>
              <p className="text-[11px] font-bold">+45 USDC</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Floating elements */}
    <div className="absolute -top-6 -right-6 h-32 w-32 bg-primary/20 rounded-full blur-3xl" />
    <div className="absolute -bottom-10 -left-10 h-40 w-40 bg-purple-500/20 rounded-full blur-3xl" />
  </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="group border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/20 transition-all duration-300">
    <CardHeader>
      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-sm leading-relaxed mt-2">{description}</CardDescription>
    </CardHeader>
  </Card>
);

const StepCard = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) => (
  <div className="relative p-8 rounded-2xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all">
    <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
      {number}
    </div>
    <div className="mb-6 h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <h4 className="text-xl font-bold mb-3">{title}</h4>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

// --- Page ---

export default function LandingPage() {
  const { connected } = useWallet();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Automatically redirect to dashboard once wallet is connected
  useEffect(() => {
    if (connected && isMounted) {
      // Small timeout to allow the user to see the "Connected" state before moving
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connected, isMounted, router]);

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/10">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] bg-purple-500/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Layers className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">StreamPay</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-primary">How It Works</a>
            <a href="#features" className="text-sm font-medium transition-colors hover:text-primary">Features</a>
            <a href="#why" className="text-sm font-medium transition-colors hover:text-primary">Why Us</a>
          </nav>

          <div className="flex items-center gap-4">
            <WalletMultiButton className="!h-11 !rounded-xl !bg-primary !px-5 !text-sm !font-semibold !text-primary-foreground hover:!bg-primary/90 !transition-all shadow-md active:scale-95" />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="max-w-2xl space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <Zap className="h-3.5 w-3.5" />
                  Now Live on Solana Devnet
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl leading-[1.1]">
                  The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Web3 Subscriptions</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  StreamPay enables seamless recurring payments and autonomous billing using stablecoins. Built for the next generation of SaaS, content, and service providers.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {connected ? (
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="h-14 rounded-2xl px-8 text-lg font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <WalletMultiButton className="!h-14 !rounded-2xl !bg-primary !px-8 !text-lg !font-bold !text-primary-foreground hover:!bg-primary/90 !transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95" />
                  )}
                  <a 
                    href="#how-it-works"
                    className="inline-flex items-center justify-center h-14 rounded-2xl px-8 text-lg font-bold bg-secondary text-secondary-foreground border border-input hover:bg-secondary/80 transition-all"
                  >
                    Learn More
                  </a>
                </div>
                <div className="flex items-center gap-6 pt-4 grayscale opacity-60">
                  <span className="text-xs font-bold uppercase tracking-widest">Powered By</span>
                  <div className="flex items-center gap-2 font-bold text-sm italic">Solana</div>
                  <div className="flex items-center gap-2 font-bold text-sm italic">USDC</div>
                </div>
              </div>

              <div className="relative lg:block">
                <MockDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">How it works</h2>
              <p className="text-lg text-muted-foreground">Setup your recurring revenue stream in minutes, not days.</p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <StepCard
                number="01"
                title="Connect Wallet"
                description="Link your Phantom or Solflare wallet. No passwords, no sign-up forms, just pure Web3 identity."
                icon={Wallet}
              />
              <StepCard
                number="02"
                title="Subscribe to Plans"
                description="Choose from fixed or tiered subscription models. Users authorize once, payments stream automatically."
                icon={RefreshCw}
              />
              <StepCard
                number="03"
                title="Automated Billing"
                description="Sit back while our smart contracts handle renewals, settlements, and notifications autonomously."
                icon={Zap}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 md:py-32 bg-secondary/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Powerful features for modern builders</h2>
                <p className="text-lg text-muted-foreground">Everything you need to scale your recurring revenue on-chain.</p>
              </div>
              <a 
                href="https://docs.dodopayments.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl px-6 py-2 text-sm font-medium transition bg-secondary text-secondary-foreground border border-input hover:bg-secondary/80"
              >
                View API Docs
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={CreditCard}
                title="Stablecoin Payments"
                description="Accept USDC and USDT with instant settlement and zero volatility risk."
              />
              <FeatureCard
                icon={RefreshCw}
                title="Recurring Billing"
                description="Set and forget subscription logic that runs completely on-chain."
              />
              <FeatureCard
                icon={BarChart3}
                title="Analytics Dashboard"
                description="Track MRR, churn, and LTV with granular real-time merchant insights."
              />
              <FeatureCard
                icon={Shield}
                title="Autonomous Billing"
                description="Smart contracts trigger payments based on pre-defined schedules."
              />
            </div>
          </div>
        </section>

        {/* Why StreamPay Section */}
        <section id="why" className="py-24 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl leading-tight">Built for speed, scale, and global reach.</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  StreamPay leverages Solana's high-performance architecture to deliver a payment experience that rivals traditional finance, without the overhead of intermediaries.
                </p>
                <ul className="space-y-4 pt-4">
                  {[
                    "Transaction fees under $0.01",
                    "Global reach with zero border restrictions",
                    "Native support for SPL stablecoins",
                    "Webhook notifications for seamless integration"
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative group p-1 rounded-[2rem] bg-gradient-to-br from-primary/20 to-purple-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl -z-10" />
                <div className="aspect-square flex items-center justify-center p-12 text-center space-y-6 flex-col">
                  <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform duration-500">
                    <Globe className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">Borderless Economy</h3>
                  <p className="text-muted-foreground">Accept payments from any wallet, anywhere in the world, in milliseconds.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[3rem] bg-primary px-8 py-20 text-center text-primary-foreground shadow-2xl shadow-primary/20 overflow-hidden">
              <div className="absolute top-0 right-0 h-64 w-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 h-64 w-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                <h2 className="text-4xl font-bold sm:text-6xl">Start Accepting Web3 Payments Today</h2>
                <p className="text-lg text-primary-foreground/80">
                  Join the next generation of merchants building on Solana. No credit cards, no chargebacks, just pure revenue.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {connected ? (
                    <Button
                      variant="secondary"
                      className="h-14 rounded-2xl px-10 text-lg font-bold shadow-lg shadow-black/10 transition-all hover:scale-105"
                      onClick={() => router.push("/dashboard")}
                    >
                      Open Dashboard
                    </Button>
                  ) : (
                    <WalletMultiButton className="!h-14 !rounded-2xl !bg-primary-foreground !px-10 !text-lg !font-bold !text-primary hover:!bg-white !transition-all shadow-lg active:scale-95" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4 mb-16">
            <div className="space-y-4 col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Layers className="text-primary-foreground h-4 w-4" />
                </div>
                <span className="text-xl font-bold">StreamPay</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                StreamPay is building the decentralized recurring payment infrastructure for the next billion users. High-performance subscriptions on Solana.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest">Resources</h4>
              <nav className="flex flex-col gap-2.5">
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">GitHub Repository</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">API Reference</a>
              </nav>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Platform</h4>
              <div className="flex flex-col gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <a href="/dashboard" className="hover:text-slate-900 transition-colors">Merchant Dashboard</a>
                <a href="/plans" className="hover:text-slate-900 transition-colors">Manage Plans</a>
                <a href="/analytics" className="hover:text-slate-900 transition-colors">Real-time Analytics</a>
                <a href="/pay/demo" className="hover:text-slate-900 transition-colors">Demo Checkout</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-border/40 pt-10">
            <p className="text-xs text-muted-foreground">© 2024 StreamPay Labs. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}