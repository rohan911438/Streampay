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
  Layers,
  ShieldCheck,
  Lock,
  EyeOff,
  Activity,
  Server,
  ChevronRight,
  AlertTriangle,
  Fingerprint
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- Main Page ---

export default function LandingPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Automatically redirect to dashboard once wallet is connected
  useEffect(() => {
    if (connected && isMounted) {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [connected, isMounted, router]);

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFDFD] text-slate-900 selection:bg-emerald-100">
      <BackgroundGradients />
      <LandingHeader />

      <main className="flex-1">
        <HeroSection connected={connected} onStart={() => router.push("/pay/demo")} onDashboard={() => router.push("/dashboard")} />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ComparisonSection />
        <SystemPreviewSection />
        <FinalCTASection connected={connected} onDashboard={() => router.push("/dashboard")} />
      </main>

      <LandingFooter />
    </div>
  );
}

// --- Layout Components ---

const BackgroundGradients = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
    <div className="absolute bottom-0 left-0 h-[600px] w-[600px] bg-blue-500/5 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/3" />
  </div>
);

const LandingHeader = () => {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <ShieldCheck className="text-emerald-400 h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase leading-none">StreamPay</span>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-1">Privacy Enabled</span>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: "How It Works", href: "#how-it-works" },
            { label: "Features", href: "#features" },
            { label: "Privacy First", href: "#privacy-first" }
          ].map((item) => (
            <a key={item.label} href={item.href} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">{item.label}</a>
          ))}
        </nav>
        <WalletMultiButton className="!h-11 !rounded-2xl !bg-slate-900 !px-5 !text-[10px] !font-black !uppercase !tracking-widest !text-white hover:!bg-slate-800 shadow-xl shadow-slate-200" />
      </div>
    </header>
  );
};

const LandingFooter = () => {
  const router = useRouter();
  return (
    <footer className="border-t border-slate-100 py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid gap-12 lg:grid-cols-4 mb-16">
          <div className="space-y-6 col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center"><ShieldCheck className="text-emerald-400 h-5 w-5" /></div>
              <span className="text-xl font-black uppercase tracking-tighter">StreamPay</span>
            </div>
            <p className="text-base text-slate-500 max-w-sm font-medium leading-relaxed">Decentralized recurring payment infrastructure built for privacy and speed on Solana.</p>
          </div>
          <div className="space-y-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900">Platform</h4>
            <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {[
                { name: "Dashboard", path: "/dashboard" },
                { name: "Plans", path: "/plans" },
                { name: "Analytics", path: "/analytics" },
                { name: "Demo Checkout", path: "/pay/demo" }
              ].map(item => (
                <button key={item.name} onClick={() => router.push(item.path)} className="text-left hover:text-slate-900 transition-all">
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-10">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">© 2024 StreamPay Labs. Powered by Solana & Cloak.</p>
        </div>
      </div>
    </footer>
  );
};

// --- Hero & Core Sections ---

const HeroSection = ({ connected, onStart, onDashboard }: { connected: boolean, onStart: () => void, onDashboard: () => void }) => (
  <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40">
    <div className="container mx-auto px-6">
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <div className="max-w-2xl space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
            <Lock className="h-3 w-3" />
            Powered by Cloak Shielded Transfers
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-6xl xl:text-7xl leading-[0.95] uppercase italic italic-none">
            Private <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">Payments</span> <br />
            for the <span className="text-slate-300">Real World</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
            Traditional blockchain payments expose your sensitive financial activity. <span className="text-slate-900 font-bold">StreamPay</span> solves this using Cloak’s shielded transaction system.
          </p>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
            <Button onClick={onStart} className="h-14 rounded-[2rem] px-8 text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-2xl shadow-slate-200 hover:-translate-y-1 transition-all">
              Start Private Payment <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={onDashboard} className="h-14 rounded-[2rem] px-8 text-[11px] font-black uppercase tracking-widest border-2 border-slate-100 hover:bg-slate-50 transition-all">
              View Dashboard
            </Button>
          </div>
        </div>
        <div className="relative mt-12 lg:mt-0">
          <PrivateTransactionMock />
          <div className="absolute -bottom-6 -right-6 bg-white p-5 rounded-2xl shadow-2xl border border-slate-100 max-w-[180px] animate-bounce-slow hidden sm:block">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase">Verified</span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 leading-tight">Subscription activated privately with Cloak.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ProblemSolutionSection = () => (
  <section id="privacy-first" className="py-32 border-y border-slate-50">
    <div className="container mx-auto px-6">
      <div className="grid lg:grid-cols-2 gap-px bg-slate-100 rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl">
        <div className="bg-white p-16 lg:p-24 space-y-8">
          <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-4xl font-black uppercase tracking-tight">The Problem</h3>
          <div className="space-y-4">
            <p className="text-lg font-medium text-slate-500 leading-relaxed">
              Public blockchains are built for <span className="text-red-600 font-bold underline decoration-red-200 underline-offset-8">radical transparency</span>. While this is great for auditing public goods, it is a catastrophic failure for private finance.
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              When business operations like payroll, vendor settlements, and SaaS subscriptions happen on-chain, your entire financial strategy—including salary structures and trade secrets—is visible to competitors, bad actors, and the public.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {["Exposed Payroll", "Public Revenue Streams", "Phishing Vulnerability", "Strategy Leakage"].map(item => (
              <div key={item} className="flex items-center gap-3 text-slate-400">
                <div className="h-2 w-2 rounded-full bg-red-200" />
                <span className="text-[10px] font-black uppercase tracking-widest">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-emerald-600 p-16 lg:p-24 space-y-8 text-white">
          <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-4xl font-black uppercase tracking-tight">The Solution</h3>
          <div className="space-y-4">
            <p className="text-lg font-medium text-emerald-50 leading-relaxed">
              StreamPay utilizes <span className="text-white font-bold underline decoration-emerald-400 underline-offset-8">Cloak's Shielded Transfers</span> to break the link between transaction validity and data visibility.
            </p>
            <p className="text-sm text-emerald-100/70 leading-relaxed">
              By leveraging Zero-Knowledge Proofs (ZKP), we prove that a payment is valid without revealing the amount or recipient. This enables professional financial confidentiality on Solana while maintaining optional auditability through secure viewing keys.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {["ZK-Shielded Transfers", "Stealth Addressing", "Selective Disclosure", "Compliance Ready"].map(item => (
              <div key={item} className="flex items-center gap-3 text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-24 lg:py-32">
    <div className="container mx-auto px-6">
      <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl uppercase italic">Seamless <span className="text-emerald-600">Privacy</span> Flow</h2>
        <p className="text-lg text-slate-500 font-medium">Setup your private economy in three simple steps.</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <StepCard number="01" title="Connect" description="Link your SPL-compatible Solana wallet instantly." icon={Wallet} />
        <StepCard number="02" title="Choose" description="Select a subscription model that fits your needs." icon={Layers} />
        <StepCard number="03" title="Pay" description="Executed privately via Cloak — zero public exposure." icon={ShieldCheck} />
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-slate-50/50">
    <div className="container mx-auto px-6">
      <div className="mb-20">
        <h2 className="text-4xl font-black tracking-tight sm:text-5xl uppercase leading-[1.1]">Engineered for <br /><span className="text-emerald-600">Privacy & Scale</span></h2>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard icon={Lock} title="Private" description="Shielded transactions powered by Cloak." />
        <FeatureCard icon={RefreshCw} title="Subscriptions" description="Automated recurring billing on-chain." />
        <FeatureCard icon={BarChart3} title="Analytics" description="Wallet insights powered by Dune." />
        <FeatureCard icon={Server} title="Fast" description="Low-latency execution via RPC Fast." />
      </div>
    </div>
  </section>
);

const ComparisonSection = () => (
  <section className="py-24 lg:py-40 bg-white relative">
    <div className="container mx-auto px-6">
      <div className="max-w-6xl mx-auto rounded-[4rem] border border-slate-100 bg-white p-12 lg:p-24 shadow-[0_50px_100px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
          <Shield className="h-64 w-64 text-emerald-600" />
        </div>
        
        <div className="text-center mb-20 space-y-4">
          <h3 className="text-4xl font-black uppercase tracking-tight">Public vs <span className="text-emerald-600">Private</span></h3>
          <p className="text-slate-500 font-medium">A technical comparison of payment architectures on Solana.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-32">
          {/* Public Side */}
          <div className="space-y-12">
            <div className="flex flex-col items-center lg:items-end gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Standard Architecture</p>
                <h4 className="text-2xl font-black uppercase italic text-slate-400">Public Payments</h4>
            </div>
            <div className="space-y-12">
              {[
                { 
                  label: "Visible Amounts", 
                  desc: "Transaction values are plain-text on the ledger, exposing business revenue and user net worth.",
                  icon: EyeOff 
                },
                { 
                  label: "Public Addresses", 
                  desc: "Sender and receiver wallets are fully linkable, creating a traceable map of financial relationships.",
                  icon: Globe 
                },
                { 
                  label: "Visible History", 
                  desc: "Every past transaction is permanently searchable, revealing long-term spending patterns.",
                  icon: Activity 
                }
              ].map(row => (
                <div key={row.label} className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:justify-end text-center lg:text-right">
                  <div className="order-2 lg:order-1 space-y-1">
                    <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">{row.desc}</p>
                  </div>
                  <div className="order-1 lg:order-2 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                    <row.icon className="h-5 w-5 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Private Side */}
          <div className="space-y-12">
            <div className="flex flex-col items-center lg:items-start gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">StreamPay Stack</p>
                <h4 className="text-2xl font-black uppercase italic text-emerald-600">Private (Cloak)</h4>
            </div>
            <div className="space-y-12">
              {[
                { 
                  label: "Hidden Amounts", 
                  desc: "Zero-Knowledge Proofs (ZKP) shield the payment value from everyone except the participants.",
                  icon: Lock 
                },
                { 
                  label: "Shielded Identities", 
                  desc: "Stealth addressing ensures that the link between users remains opaque on-chain.",
                  icon: ShieldCheck 
                },
                { 
                  label: "Selective Audit", 
                  desc: "Compliance-ready viewing keys allow for controlled disclosure to authorized parties.",
                  icon: EyeOff 
                }
              ].map(row => (
                <div key={row.label} className="flex flex-col lg:flex-row items-center lg:items-start gap-6 text-center lg:text-left">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 flex-shrink-0">
                    <row.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{row.label}</span>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SystemPreviewSection = () => (
  <section className="py-24 bg-slate-900 text-white">
    <div className="container mx-auto px-6">
      <h2 className="text-4xl font-black sm:text-5xl uppercase italic text-center mb-20">Live System <span className="text-emerald-400">Preview</span></h2>
      <div className="grid lg:grid-cols-3 gap-8">
        {[
          { title: "Merchant Control", label: "Dashboard", color: "emerald", icon: Activity },
          { title: "Shielded Checkout", label: "Flow", color: "blue", icon: ShieldCheck },
          { title: "Dune Insights", label: "Analytics", color: "purple", icon: BarChart3 }
        ].map(item => (
          <div key={item.title} className="space-y-4">
            <div className="aspect-[4/3] rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center relative overflow-hidden group">
              <div className={cn("absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20", 
                item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500')} 
              />
              <item.icon className={cn("h-12 w-12", 
                item.color === 'emerald' ? 'text-emerald-400' : item.color === 'blue' ? 'text-blue-400' : 'text-purple-400')} 
              />
              <div className={cn("absolute bottom-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-black uppercase", 
                item.color === 'emerald' ? 'bg-emerald-500' : item.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500')}>
                {item.label}
              </div>
            </div>
            <h4 className="text-lg font-bold uppercase italic">{item.title}</h4>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCTASection = ({ connected, onDashboard }: { connected: boolean, onDashboard: () => void }) => (
  <section className="py-32">
    <div className="container mx-auto px-6">
      <div className="relative rounded-[3rem] bg-slate-900 px-8 py-20 text-center text-white shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl font-black sm:text-6xl uppercase italic leading-[0.95]">Start Using <br /><span className="text-emerald-400">Private Payments</span> Today</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {connected ? (
              <Button onClick={onDashboard} className="h-14 rounded-2xl px-10 text-[11px] font-black uppercase bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-all hover:scale-105">Open Dashboard</Button>
            ) : (
              <WalletMultiButton className="!h-14 !rounded-2xl !bg-emerald-500 !px-10 !text-[11px] !font-black !uppercase !tracking-widest !text-slate-900 hover:!bg-emerald-400 !transition-all shadow-2xl active:scale-95" />
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- Visual Mockups ---

const PrivateTransactionMock = () => (
  <div className="relative w-full max-w-lg mx-auto group">
    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-[2.5rem] blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
    <div className="relative rounded-[2rem] border border-emerald-500/30 bg-slate-950/90 backdrop-blur-2xl shadow-2xl p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><ShieldCheck className="h-6 w-6 text-emerald-400" /></div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-widest">Private Transaction</h4>
            <div className="flex items-center gap-1.5 mt-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-tighter">Executed via Cloak</p></div>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shielded</div>
      </div>
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
          <div className="flex justify-between items-center"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</p><div className="flex items-center gap-2"><EyeOff className="h-3 w-3 text-emerald-500/50" /><span className="text-sm font-black text-white italic">DETAILS HIDDEN</span></div></div>
          <div className="flex justify-between items-center"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recipient</p><div className="flex items-center gap-2 text-emerald-400"><Lock className="h-3 w-3" /><span className="text-xs font-mono font-bold">Shielded Address</span></div></div>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-3"><Fingerprint className="h-4 w-4 text-emerald-500" /><span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cloak Proof Verified</span></div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Atom Components ---

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="group relative border-border/50 bg-card/50 backdrop-blur-sm hover:bg-white hover:border-emerald-500/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Icon className="h-16 w-16 text-emerald-600" /></div>
    <CardHeader className="relative z-10">
      <div className="h-12 w-12 rounded-xl bg-emerald-500/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all"><Icon className="h-6 w-6 text-emerald-600" /></div>
      <CardTitle className="text-xl font-black uppercase tracking-tight">{title}</CardTitle>
      <CardDescription className="text-sm font-medium leading-relaxed mt-2 text-slate-500">{description}</CardDescription>
    </CardHeader>
  </Card>
);

const StepCard = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) => (
  <div className="relative p-10 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-200/20 transition-all group">
    <div className="absolute -top-4 -left-4 h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow-xl shadow-emerald-200">{number}</div>
    <div className="mb-8 h-16 w-16 rounded-[2rem] bg-emerald-50 flex items-center justify-center group-hover:rotate-6 transition-transform"><Icon className="h-8 w-8 text-emerald-600" /></div>
    <h4 className="text-2xl font-black mb-4 uppercase tracking-tight">{title}</h4>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{description}</p>
  </div>
);