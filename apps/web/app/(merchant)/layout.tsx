"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Rocket,
  Layers,
  ChevronRight,
  Terminal
} from "lucide-react";
import { WalletStatus } from "@/components/wallet-status";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/developer", label: "Developer", icon: Terminal },
  { href: "/pay/demo", label: "Demo Pay", icon: Rocket },
];

export default function MerchantLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-white py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
            <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-10 w-48 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        </header>
        <div className="bg-white border-b border-slate-100 py-3">
          <div className="mx-auto max-w-7xl px-6">
            <div className="h-4 w-24 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
        <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-12">
           <div className="space-y-4">
              <div className="h-12 w-64 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-64 w-full bg-slate-100 rounded-3xl animate-pulse" />
           </div>
        </main>
      </div>
    );
  }

  const activeItem = navItems.find(item => item.href === pathname);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* Global Top Navigation */}
      <header className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        scrolled 
          ? "bg-white/90 backdrop-blur-lg border-slate-200 py-3 shadow-sm" 
          : "bg-white border-transparent py-5"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-slate-200">
                <Layers className="text-white h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 group-hover:text-primary transition-colors">
                  StreamPay
                </p>
                <h1 className="text-sm font-black text-slate-900 tracking-tighter uppercase">Console</h1>
              </div>
            </Link>

            {/* Main Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300",
                      isActive 
                        ? "bg-slate-900 text-white shadow-xl shadow-slate-200" 
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-6">
             {/* Wallet Status Integrated into Header */}
             <div className="hidden md:block">
                <WalletStatus />
             </div>
             
             <div className="h-8 w-px bg-slate-200 hidden md:block" />
             
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live</span>
             </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb / Page Context Sub-header */}
      <div className="bg-white border-b border-slate-100 py-3">
         <div className="mx-auto max-w-7xl px-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Console</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900">{activeItem?.label || "Page"}</span>
         </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-both">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 opacity-50">
              <Layers className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">StreamPay © 2026</span>
           </div>
           <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
              <a href="#" className="hover:text-slate-900 transition-colors">API Keys</a>
           </div>
        </div>
      </footer>
    </div>
  );
}