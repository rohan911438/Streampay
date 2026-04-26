"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import { Layers, ChevronLeft } from "lucide-react";

export default function SubscriberLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-slate-900 rounded flex items-center justify-center">
                <Layers className="text-white h-3 w-3" />
              </div>
              <span className="text-sm font-bold tracking-tighter uppercase text-slate-900">StreamPay</span>
            </div>
          </div>
          <Link href="/" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
            Cancel
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6 bg-dot-pattern opacity-[0.8] text-slate-100">
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
          {children}
        </div>
      </main>
      <footer className="py-8 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Secure payment powered by Dodo Payments
        </p>
      </footer>
    </div>
  );
}