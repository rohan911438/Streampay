"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  DollarSign,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";

type BalanceResponse = {
  summary?: {
    totalBalance?: number;
    totalUsdValue?: number;
    tokenCount?: number;
  };
};

type TransactionItem = {
  signature: string | null;
  timestamp: string | null;
  type: string;
  amount: number;
  usdValue: number;
  status: string;
};

type TransactionsResponse = {
  count?: number;
  transactions?: TransactionItem[];
};

type AnalyticsData = {
  walletBalanceUsd: number;
  totalTransactions: number;
  recentActivity: TransactionItem[];
};

const EMPTY_ANALYTICS: AnalyticsData = {
  walletBalanceUsd: 0,
  totalTransactions: 0,
  recentActivity: [],
};

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
  <Card className="border-slate-200 bg-white shadow-sm overflow-hidden group">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</CardDescription>
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tighter text-slate-900">{value}</div>
    </CardContent>
  </Card>
  );
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 4 })} SOL`;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortSignature(value: string | null): string {
  if (!value || value.length < 12) {
    return value ?? "-";
  }

  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function toChartSeries(items: TransactionItem[]): Array<{ day: string; volume: number }> {
  const rolling = new Map<string, number>();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    rolling.set(key, 0);
  }

  items.forEach((tx) => {
    if (!tx.timestamp) {
      return;
    }

    const date = new Date(tx.timestamp);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = date.toISOString().slice(0, 10);
    if (!rolling.has(key)) {
      return;
    }

    rolling.set(key, (rolling.get(key) ?? 0) + tx.usdValue);
  });

  return Array.from(rolling.entries()).map(([key, volume]) => {
    const d = new Date(`${key}T00:00:00Z`);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      volume,
    };
  });
}

export default function AnalyticsPage() {
  const { connected, publicKey } = useWallet();
  const walletAddress = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData>(EMPTY_ANALYTICS);

  const refresh = useCallback(async () => {
    if (!connected || !walletAddress) {
      setData(EMPTY_ANALYTICS);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [balanceRes, txRes] = await Promise.all([
        fetch(`/api/svm/balances/${walletAddress}?chain=solana`, { cache: "no-store" }),
        fetch(`/api/svm/transactions/${walletAddress}?chain=solana&limit=20`, { cache: "no-store" }),
      ]);

      const balanceJson = (await balanceRes.json()) as BalanceResponse & { error?: string };
      const txJson = (await txRes.json()) as TransactionsResponse & { error?: string };

      if (!balanceRes.ok) {
        throw new Error(balanceJson.error ?? "Failed to fetch wallet balance.");
      }

      if (!txRes.ok) {
        throw new Error(txJson.error ?? "Failed to fetch wallet transactions.");
      }

      setData({
        walletBalanceUsd: balanceJson.summary?.totalUsdValue ?? 0,
        totalTransactions: txJson.count ?? txJson.transactions?.length ?? 0,
        recentActivity: txJson.transactions ?? [],
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [connected, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const chartData = useMemo(() => toChartSeries(data.recentActivity), [data.recentActivity]);

  const walletLabel = useMemo(() => {
    if (!walletAddress) {
      return "No wallet connected";
    }
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`;
  }, [walletAddress]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
            <BarChart3 className="h-3 w-3" />
            Wallet Analytics
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Analytics
          </h2>
          <p className="max-w-xl text-sm font-medium text-slate-500 leading-relaxed">
            Real-time wallet activity powered by Dune SIM on Solana.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="h-11 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            onClick={() => void refresh()}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 text-slate-400" />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Wallet" value={walletLabel} icon={Wallet} />
        <StatCard label="Wallet Balance (SOL)" value={formatCurrency(data.walletBalanceUsd)} icon={DollarSign} />
        <StatCard label="Total Transactions" value={String(data.totalTransactions)} icon={Activity} />
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-6 flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-semibold">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {!connected ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-slate-700">Connect your wallet to view analytics.</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-8">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">7-Day Activity Trend</CardTitle>
            <CardDescription>Daily volume from the most recent wallet transactions.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}
                  formatter={(value) => [formatCurrency(Number(value)), "Volume"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#0F172A" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <CardDescription>Latest transactions from your connected wallet.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading latest activity...</div>
          ) : data.recentActivity.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No transactions found for this wallet yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Value (SOL)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentActivity.map((tx, idx) => (
                    <tr key={`${tx.signature ?? "tx"}-${idx}`} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{formatDate(tx.timestamp)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-900 uppercase">{tx.type}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-900">{tx.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">{formatCurrency(tx.usdValue)}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">{tx.status}</td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-500">{shortSignature(tx.signature)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}