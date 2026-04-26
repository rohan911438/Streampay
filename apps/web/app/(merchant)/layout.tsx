"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CreditCard, BarChart3, Rocket } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plans", label: "Plans", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/pay/demo", label: "Demo Pay", icon: Rocket },
];

export default function MerchantLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">
                StreamPay
              </p>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Merchant Console</h1>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                      isActive 
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
             <div className="h-8 w-px bg-slate-200" />
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live</span>
             </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}