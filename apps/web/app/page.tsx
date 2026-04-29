"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  CheckCircle2,
  ChevronRight,
  Code2,
  CreditCard,
  Globe,
  Layers,
  Lock,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white selection:bg-cyan-300/30">
      <BackgroundVisuals />
      <TopNav />

      <main className="relative z-10">
        <HeroSection
          connected={connected}
          onStartBuilding={() => router.push("/dashboard")}
          onTryDemo={() => router.push("/pay/demo")}
        />
        <PlatformModelSection />
        <SystemFlowSection />
        <FeaturesSection />
        <DeveloperSection />
        <BusinessSection />
        <ComparisonSection />
        <VisualProofSection />
        <FinalCTASection onStartBuilding={() => router.push("/dashboard")} onTryDemo={() => router.push("/pay/demo")} />
      </main>

      <Footer />
    </div>
  );
}

function BackgroundVisuals() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-8rem] top-[-6rem] h-[30rem] w-[30rem] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute right-[-10rem] top-[8rem] h-[34rem] w-[34rem] rounded-full bg-fuchsia-500/20 blur-[140px]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <div className="text-lg font-black uppercase tracking-[0.24em] text-white">StreamPay</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.38em] text-cyan-200/80">Stripe for private crypto payments</div>
          </div>
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {[["Platform", "#platform"], ["Features", "#features"], ["Developers", "#developers"], ["Businesses", "#businesses"]].map(([label, href]) => (
            <a key={label} href={href} className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60 transition hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <WalletMultiButton className="!h-11 !rounded-2xl !border !border-white/15 !bg-white/5 !px-5 !text-[10px] !font-black !uppercase !tracking-[0.28em] !text-white hover:!bg-white/10" />
      </div>
    </header>
  );
}

function HeroSection({
  connected,
  onStartBuilding,
  onTryDemo,
}: {
  connected: boolean;
  onStartBuilding: () => void;
  onTryDemo: () => void;
}) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl space-y-8">
          <div className="flex flex-wrap gap-3">
            <Badge>Privacy Enabled</Badge>
            <Badge>Secured by MagicBlock</Badge>
            <Badge>Powered by RPC Fast</Badge>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-100">
            <Sparkles className="h-3.5 w-3.5" />
            Privacy-first payments infrastructure for web3
          </div>

          <div className="space-y-6">
            <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.93] tracking-[-0.04em] text-white sm:text-6xl xl:text-7xl">
              Privacy-First Payments Infrastructure for Web3
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              StreamPay gives developers and businesses a Stripe-like API for private crypto payments. Integrate private, cross-chain payment intake in your own app while funds settle securely on Solana.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button onClick={onStartBuilding} className="h-14 rounded-[1.2rem] bg-cyan-300 px-7 text-[11px] font-black uppercase tracking-[0.28em] text-slate-950 hover:bg-cyan-200">
              Start Building <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={onTryDemo} variant="outline" className="h-14 rounded-[1.2rem] border-white/15 bg-white/5 px-7 text-[11px] font-black uppercase tracking-[0.28em] text-white hover:bg-white/10">
              Try Demo
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/55">
            <MiniStat label="Private execution" value="Cloak" />
            <MiniStat label="Secure orchestration" value="MagicBlock" />
            <MiniStat label="Settlement layer" value="Solana" />
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-cyan-400/10 blur-3xl" />
          <div className="relative space-y-5 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
              <DashboardMock />
              <PrivateTransactionCard />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[["API requests", "12.4k / day"], ["Private tx success", "99.98%"], ["Avg settlement", "~2.1s"]].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">{label}</div>
                  <div className="mt-2 text-xl font-black text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>
          {connected ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Wallet connected, demo and dashboard remain available
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PlatformModelSection() {
  return (
    <section id="platform" className="border-y border-white/10 bg-slate-950/35 py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.32em] text-white/60">
              Platform model
            </div>
            <h2 className="max-w-xl text-4xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-5xl">
              Embed private payments inside the products people already use.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-white/65">
              Companies connect to StreamPay APIs to enable private payments, while StreamPay handles execution infrastructure, state visibility, and secure settlement on Solana behind the scenes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[["Your app", "Checkout, payroll, subscriptions, invoicing"], ["StreamPay API", "One integration for private payment workflows"], ["Cloak", "Private execution layer"], ["MagicBlock", "Secure orchestration layer"], ["Solana", "Final settlement and on-chain records"], ["Dashboard", "Merchant analytics and status tracking"]].map(([title, desc]) => (
              <Card key={title} className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
                <CardHeader className="space-y-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black uppercase tracking-[0.18em] text-white">{title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-relaxed text-white/60">{desc}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SystemFlowSection() {
  const nodes = [
    ["External app", "Client-side checkout or SaaS workflow"],
    ["StreamPay API", "Payment intent and subscription state"],
    ["Cloak", "Private execution"],
    ["MagicBlock", "Secure layer"],
    ["Solana", "Settlement"],
    ["Dashboard analytics", "Merchant visibility"],
  ];

  return (
    <section className="py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">System flow</div>
            <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.03em] text-white sm:text-4xl">
              From an external app to settled funds and analytics.
            </h3>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/55 lg:block">
            Private, secure, observable
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          {nodes.map((node, index) => (
            <div key={node[0]} className="relative">
              <div className="h-full rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">0{index + 1}</div>
                <div className="mt-4 text-lg font-black uppercase tracking-[-0.02em] text-white">{node[0]}</div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{node[1]}</p>
              </div>
              {index < nodes.length - 1 ? (
                <div className="absolute right-[-1rem] top-1/2 hidden -translate-y-1/2 lg:block">
                  <ChevronRight className="h-5 w-5 text-white/25" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    [ShieldCheck, "Private Payments (Cloak)", "Shielded payment execution with private transaction handling."],
    [Blocks, "Secure Execution (MagicBlock)", "A secure execution layer that keeps the payment workflow reliable."],
    [Globe, "Cross-Chain Input, Solana Settlement", "Accept inputs across chains and settle the final funds on Solana."],
    [Code2, "Developer APIs", "Simple endpoints for creating payments, checking status, and managing lifecycles."],
    [BarChart3, "Merchant Dashboard", "Unified visibility into payments, subscriptions, and analytics."],
    [Zap, "Fast Infrastructure (RPC Fast)", "Low-latency connectivity for production-grade payment flows."],
  ];

  return (
    <section id="features" className="border-y border-white/10 bg-slate-950/30 py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">Features</div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Infrastructure for private payments, not just a demo.</h2>
          <p className="text-lg leading-relaxed text-white/65">StreamPay is designed to be integrated, branded, and scaled by other products, while still giving judges a clear demo path in the same homepage experience.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map(([Icon, title, description]) => (
            <Card key={title} className="group border-white/10 bg-white/5 text-white shadow-none transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/10">
              <CardHeader className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 transition group-hover:bg-cyan-300/15">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-5 text-lg font-black uppercase tracking-[0.16em] text-white">{title}</CardTitle>
                <CardDescription className="mt-3 text-sm leading-relaxed text-white/60">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeveloperSection() {
  return (
    <section id="developers" className="py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">For developers</div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">API-first private payment workflows.</h2>
          <p className="max-w-xl text-lg leading-relaxed text-white/65">StreamPay gives builders a familiar integration model: create a payment intent, confirm execution, read status, and automate subscriptions without handling private execution details in the app layer.</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm font-black uppercase tracking-[0.24em] text-white">Example API usage</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Developer flow</div>
          </div>
          <div className="space-y-4 font-mono text-sm text-cyan-100/90">
            <CodeBlock label="Create payment">{`POST /api/payments/create
{
  "merchant": "9F...J2",
  "amount": 2500000,
  "paymentType": "private"
}`}</CodeBlock>
            <CodeBlock label="Check status">{`GET /api/payments/status?paymentId=7c2...

{
  "status": "completed",
  "executionReference": "cloak:tx_8f1..."
}`}</CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

function BusinessSection() {
  const useCases = [
    ["Subscriptions", "Recurring billing with private execution and clear merchant state."],
    ["Payroll", "Confidential salary and contractor payments with on-chain records."],
    ["Global payments", "Private payment intake across markets without exposing sensitive details."],
  ];

  return (
    <section id="businesses" className="border-y border-white/10 bg-slate-950/30 py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="space-y-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">For businesses</div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Use private payments wherever trust and discretion matter.</h2>
          <p className="max-w-xl text-lg leading-relaxed text-white/65">StreamPay is built for companies that need a premium payment layer for products, internal ops, or customer-facing fintech experiences.</p>
        </div>

        <div className="grid gap-4">
          {useCases.map(([title, description]) => (
            <div key={title} className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-black uppercase tracking-[0.14em] text-white">{title}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ["Public vs private", "Transparent ledgers expose transaction details", "Privacy-preserving execution keeps sensitive data out of sight"],
    ["Fragmented vs unified", "Different tools for checkout, privacy, settlement, and analytics", "One platform API and one dashboard for the full flow"],
    ["Complex vs simple API", "Teams stitch together custom payment infrastructure", "Developers call clean payment and subscription endpoints"],
  ];

  return (
    <section className="py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">Why StreamPay wins</div>
          <h2 className="text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">A modern payment infrastructure stack, not a patched-together workflow.</h2>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-3 border-b border-white/10 bg-slate-950/65 px-6 py-4 text-[10px] font-bold uppercase tracking-[0.32em] text-white/50">
            <div>Dimension</div>
            <div>Traditional blockchain payments</div>
            <div>StreamPay</div>
          </div>
          {rows.map(([dimension, oldWay, newWay]) => (
            <div key={dimension} className="grid grid-cols-1 gap-4 border-b border-white/10 px-6 py-6 md:grid-cols-3 md:items-start">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-white">{dimension}</div>
              <div className="text-sm leading-relaxed text-white/55">{oldWay}</div>
              <div className="text-sm leading-relaxed text-cyan-100/90">{newWay}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualProofSection() {
  return (
    <section className="border-y border-white/10 bg-slate-950/30 py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">Mock dashboard</div>
              <div className="mt-2 text-2xl font-black uppercase text-white">Merchant visibility</div>
            </div>
            <Badge>Secured by MagicBlock</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatPanel label="Pending intents" value="24" accent="cyan" />
            <StatPanel label="Completed payments" value="1,204" accent="emerald" />
            <StatPanel label="Active subs" value="328" accent="fuchsia" />
            <StatPanel label="Settlement health" value="99.9%" accent="sky" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">Private transaction</div>
              <div className="mt-2 text-2xl font-black uppercase text-white">Payment card preview</div>
            </div>
            <Badge>Privacy Enabled</Badge>
          </div>
          <div className="rounded-[1.5rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 via-white/5 to-fuchsia-400/10 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Private Transaction</div>
                <div className="mt-2 text-xl font-black uppercase text-white">$2,500.00 equivalent</div>
              </div>
              <div className="rounded-full border border-white/15 bg-slate-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">Cloak routed</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Recipient" value="Hidden / protected" />
              <InfoTile label="Status" value="Settling on Solana" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({ onStartBuilding, onTryDemo }: { onStartBuilding: () => void; onTryDemo: () => void }) {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/15 via-slate-950 to-fuchsia-400/15 p-8 shadow-[0_40px_140px_rgba(0,0,0,0.45)] lg:p-14">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-[120px]" />
          <div className="relative max-w-3xl space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-200/80">Demo and platform together</div>
            <h2 className="text-4xl font-black uppercase leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
              A working product for judges, and a platform story for the market.
            </h2>
            <p className="text-lg leading-relaxed text-white/65">
              Explore the demo flow, or start building on StreamPay as a privacy-first payments infrastructure layer for Web3.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button onClick={onStartBuilding} className="h-14 rounded-[1.2rem] bg-white px-7 text-[11px] font-black uppercase tracking-[0.28em] text-slate-950 hover:bg-cyan-200">
                Start Building <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={onTryDemo} variant="outline" className="h-14 rounded-[1.2rem] border-white/20 bg-white/5 px-7 text-[11px] font-black uppercase tracking-[0.28em] text-white hover:bg-white/10">
                Try Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/75 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="text-sm font-semibold text-white/55">StreamPay - privacy-first payments infrastructure on Solana.</div>
        <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
          <span>Privacy Enabled</span>
          <span>Secured by MagicBlock</span>
          <span>Powered by RPC Fast</span>
        </div>
      </div>
    </footer>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function StatPanel({ label, value, accent }: { label: string; value: string; accent: "cyan" | "emerald" | "fuchsia" | "sky" }) {
  const accentStyles: Record<typeof accent, string> = {
    cyan: "from-cyan-400/20 to-cyan-400/5",
    emerald: "from-emerald-400/20 to-emerald-400/5",
    fuchsia: "from-fuchsia-400/20 to-fuchsia-400/5",
    sky: "from-sky-400/20 to-sky-400/5",
  };

  return (
    <div className={cn("rounded-[1.25rem] border border-white/10 bg-gradient-to-br p-5", accentStyles[accent])}>
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">{value}</div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-slate-950/65 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/45">{label}</div>
      <div className="mt-2 text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5 shadow-inner shadow-cyan-400/5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">Merchant dashboard</div>
          <div className="mt-2 text-xl font-black uppercase text-white">Live payment ops</div>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-100">Online</div>
      </div>
      <div className="mt-5 space-y-3">
        {[["Private payments", "324"], ["Subscription renewals", "88"], ["Pending confirmations", "14"]].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">{label}</span>
            <span className="text-sm font-black text-white">{value}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/10 via-white/5 to-fuchsia-400/10 p-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Private Transaction</div>
        <div className="mt-2 text-sm font-semibold text-white/80">Funds settled on Solana, execution routed through Cloak and MagicBlock.</div>
      </div>
    </div>
  );
}

function PrivateTransactionCard() {
  return (
    <div className="rounded-[1.5rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-slate-950/95 to-fuchsia-400/10 p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/55">Payment card</div>
          <div className="mt-2 text-xl font-black uppercase text-white">Private Transaction</div>
        </div>
        <Lock className="h-5 w-5 text-cyan-200" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/45">Amount</div>
          <div className="mt-2 text-lg font-black text-white">Hidden</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/45">Execution</div>
          <div className="mt-2 text-sm font-semibold text-white/80">Cloak routed, MagicBlock secured</div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-slate-950/75 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-200/80">{label}</div>
      <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-cyan-50/85">{children}</pre>
    </div>
  );
}
