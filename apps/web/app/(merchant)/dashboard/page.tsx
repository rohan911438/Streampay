import { getDodoWebhookSnapshot } from "@/lib/dodo-webhook-state";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet-status";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Layers, 
  DollarSign, 
  Activity, 
  Settings, 
  ArrowUpRight, 
  Zap, 
  Clock, 
  MousePointer2,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MetricCard = ({ label, value, icon: Icon, trend }: { label: string, value: string, icon: any, trend?: string }) => (
  <Card className="group relative overflow-hidden border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50">
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-slate-50 transition-colors group-hover:bg-primary/5" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</CardDescription>
      <div className="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tighter text-slate-900">{value}</div>
      {trend && (
        <p className="mt-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
          {trend} <span className="text-slate-400">vs last month</span>
        </p>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const webhookSnapshot = getDodoWebhookSnapshot();

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <Activity className="h-3 w-3" />
            Live Operations
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Control Center
          </h2>
          <p className="max-w-xl text-sm font-medium text-slate-500 leading-relaxed">
            Monitor your subscription health, manage revenue streams, and track real-time blockchain webhook events.
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <WalletStatus />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Active Plans" value="3" icon={Layers} trend="+1" />
        <MetricCard label="Subscribers" value="24" icon={Users} trend="+12.4%" />
        <MetricCard label="Monthly Revenue" value="1,240 USDC" icon={DollarSign} trend="+8.2%" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.5fr]">
        {/* Main Content Column */}
        <div className="space-y-8">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                <CardDescription>Latest events streamed from Dodo Payments.</CardDescription>
              </div>
              <Button variant="secondary" className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest">
                View All
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {webhookSnapshot.latestEvents.length > 0 ? (
                <div className="space-y-4">
                  {webhookSnapshot.latestEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="group relative flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 transition-all hover:bg-white hover:shadow-md hover:shadow-slate-100">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-900">{event.eventType}</p>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            {new Date(event.receivedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                          {event.customerEmail ?? "Unknown customer"}
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                           <span className="px-2 py-0.5 rounded-md bg-white border border-slate-100 text-[9px] font-black uppercase text-slate-400">
                             ID: {event.id.slice(0, 8)}...
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-slate-200" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Waiting for data...</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Configure your webhook URL in Dodo to see live activity here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xl font-bold">Subscription Snapshots</CardTitle>
              <CardDescription>Consolidated state for active user subscriptions.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {webhookSnapshot.subscriptions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {webhookSnapshot.subscriptions.slice(0, 5).map((sub) => (
                    <div key={sub.recordKey} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                          {sub.customerEmail?.[0].toUpperCase() ?? "S"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{sub.customerEmail ?? "System Sub"}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sub.subscriptionId ?? "PENDING"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm",
                          sub.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {sub.status === 'active' && <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />}
                          {sub.status}
                        </div>
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{sub.paymentCount} payments</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-sm font-bold text-slate-300 uppercase tracking-widest italic">
                  No snapshots available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          <Card className="border-slate-200/60 shadow-lg shadow-slate-100 overflow-hidden group">
            <div className="h-2 w-full bg-gradient-to-r from-primary to-purple-600" />
            <CardHeader>
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              <CardDescription>Shortcuts for common operations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Link
                href="/plans"
                className="group/btn relative flex items-center justify-between rounded-xl bg-slate-900 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
              >
                Manage Plans
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
              </Link>
              
              <Link
                href="/analytics"
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                Full Analytics
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </Link>
              
              <Link
                href="/pay/demo"
                className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4 text-sm font-bold text-slate-500 transition-all hover:border-slate-400 hover:text-slate-700"
              >
                Checkout Demo
                <MousePointer2 className="h-4 w-4 text-slate-300" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 shadow-sm">
             <CardHeader className="pb-3">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                 <Settings className="h-5 w-5 text-primary" />
               </div>
               <CardTitle className="text-base font-bold">Integration Status</CardTitle>
               <CardDescription className="text-xs">Current API connectivity state.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100">
                   <span className="text-[10px] font-bold uppercase text-slate-400">Webhook URL</span>
                   <span className="text-[10px] font-black text-emerald-600">CONFIGURED</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100">
                   <span className="text-[10px] font-bold uppercase text-slate-400">API Key</span>
                   <span className="text-[10px] font-black text-emerald-600">VALID</span>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}