"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  CreditCard,
  CheckCircle2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const revenueData = [
  { day: "Mon", amount: 420 },
  { day: "Tue", amount: 580 },
  { day: "Wed", amount: 490 },
  { day: "Thu", amount: 720 },
  { day: "Fri", amount: 890 },
  { day: "Sat", amount: 940 },
  { day: "Sun", amount: 1100 },
];

const topPlans = [
  { name: "Starter Pro", count: 142, revenue: 6958, color: "bg-blue-500" },
  { name: "Enterprise", count: 48, revenue: 9552, color: "bg-purple-500" },
  { name: "Annual Basic", count: 24, revenue: 11760, color: "bg-emerald-500" },
];

const recentTransactions = [
  { id: "tx_1", user: "0x82...k4f2", amount: 49, date: "2 mins ago", status: "success" },
  { id: "tx_2", user: "0x31...a9b1", amount: 199, date: "15 mins ago", status: "success" },
  { id: "tx_3", user: "0x74...e2c4", amount: 49, date: "1 hour ago", status: "success" },
  { id: "tx_4", user: "0x12...c8d5", amount: 490, date: "3 hours ago", status: "success" },
];

// --- Components ---

const StatCard = ({ label, value, icon: Icon, trend, trendValue }: { label: string, value: string, icon: any, trend: 'up' | 'down', trendValue: string }) => (
  <Card className="border-slate-200 bg-white shadow-sm overflow-hidden group">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</CardDescription>
      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tighter text-slate-900">{value}</div>
      <div className="flex items-center gap-1.5 mt-2">
        {trend === 'up' ? (
          <div className="flex items-center text-emerald-600 font-bold text-[10px]">
            <TrendingUp className="h-3 w-3 mr-0.5" />
            {trendValue}
          </div>
        ) : (
          <div className="flex items-center text-red-500 font-bold text-[10px]">
            <ArrowDownRight className="h-3 w-3 mr-0.5" />
            {trendValue}
          </div>
        )}
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">vs prev period</span>
      </div>
    </CardContent>
  </Card>
);

// --- Page ---

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-screen w-full animate-pulse bg-slate-50/50" />;
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
            <BarChart3 className="h-3 w-3" />
            Business Intelligence
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Analytics
          </h2>
          <p className="max-w-xl text-sm font-medium text-slate-500 leading-relaxed">
            Track your MRR, growth velocity, and payment performance with real-time on-chain data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="h-11 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            Last 7 Days
          </Button>
          <Button variant="secondary" className="h-11 w-11 p-0 rounded-xl flex items-center justify-center">
            <Download className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Revenue" value="$28,270" icon={DollarSign} trend="up" trendValue="+12.4%" />
        <StatCard label="Active Subs" value="214" icon={Users} trend="up" trendValue="+8.2%" />
        <StatCard label="Tx Volume" value="1,042" icon={Activity} trend="down" trendValue="-2.1%" />
      </div>

      {/* Main Chart Section */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-8">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold">Revenue Growth</CardTitle>
            <CardDescription>Daily revenue settlements in USDC over the past week.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Settled Revenue</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
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
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
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

      <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr]">
        {/* Recent Transactions */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
            <CardDescription>Latest payment settlements verified on Solana.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User Wallet</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                            {tx.user[2].toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-900 tracking-tight">{tx.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-slate-900">${tx.amount}</td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{tx.date}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-tighter border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3" />
                          {tx.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 text-center">
              <Button variant="secondary" className="h-9 px-6 rounded-lg text-[10px] font-black uppercase tracking-widest">
                View Transaction Ledger
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Plans */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Top Performance</CardTitle>
            <CardDescription>Most popular subscription tiers by volume.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {topPlans.map((plan) => (
              <div key={plan.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", plan.color)} />
                    <span className="text-sm font-bold text-slate-900 tracking-tight">{plan.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.count} Users</span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                   <div 
                    className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-1000", plan.color)} 
                    style={{ width: `${(plan.revenue / 12000) * 100}%` }}
                   />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <span>Revenue Contribution</span>
                  <span className="text-slate-900">${plan.revenue}</span>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-slate-100">
              <div className="rounded-2xl bg-slate-900 p-6 text-white space-y-4 shadow-xl shadow-slate-200 relative overflow-hidden">
                 <div className="absolute top-0 right-0 h-24 w-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Growth Tip</p>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                 </div>
                 <h4 className="text-sm font-bold leading-relaxed">Your "Enterprise" tier is growing 15% faster than last month. Consider promoting it more!</h4>
                 <Button className="w-full h-10 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-white/90">
                    Create Promotion
                 </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}