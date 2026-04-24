import Link from "next/link";
import type { ReactNode } from "react";

export default function SubscriberLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
              PayStream
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Subscriber payment flow</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            Merchant view
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}