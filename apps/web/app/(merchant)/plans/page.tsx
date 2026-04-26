"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Copy, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  Layers,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const initialPlans = [
  {
    id: "pdt_1",
    name: "Starter Pro",
    price: 49,
    interval: "monthly",
    description: "Perfect for growing teams and early-stage SaaS platforms.",
    active: true,
  },
  {
    id: "pdt_2",
    name: "Enterprise",
    price: 199,
    interval: "monthly",
    description: "Advanced features and priority support for high-volume merchants.",
    active: true,
  },
  {
    id: "pdt_3",
    name: "Annual Basic",
    price: 490,
    interval: "yearly",
    description: "Discounted annual plan with all basic features included.",
    active: true,
  }
];

// --- Page ---

export default function PlansPage() {
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!mounted) {
    return <div className="h-96 w-full animate-pulse bg-slate-50/50 rounded-3xl" />;
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
            <Layers className="h-3 w-3" />
            Product Catalog
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Subscription Plans
          </h2>
          <p className="max-w-xl text-sm font-medium text-slate-500 leading-relaxed">
            Manage your recurring pricing models and generate checkout links for your customers.
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="h-14 rounded-xl px-8 text-sm font-black uppercase tracking-[0.2em] bg-slate-900 text-white shadow-xl shadow-slate-200 hover:-translate-y-1 transition-all flex items-center gap-3"
        >
          <Plus className="h-5 w-5" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="group relative overflow-hidden border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                     <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                     Active
                  </div>
                  <CardTitle className="text-xl font-bold pt-2">{plan.name}</CardTitle>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter text-slate-900">${plan.price}</span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/ {plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
              </div>
              
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 min-h-[40px]">
                {plan.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  <Button variant="secondary" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
                    <Edit3 className="h-4 w-4 text-slate-500" />
                  </Button>
                  <Button variant="secondary" className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={() => handleCopy(plan.id)}
                  className="h-9 rounded-lg px-4 text-[11px] font-bold uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 transition-all hover:border-slate-300 hover:bg-slate-100/50"
        >
          <div className="h-16 w-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:border-primary transition-all duration-500 shadow-sm">
            <Plus className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Add new plan</p>
            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Pricing tier</p>
          </div>
        </button>
      </div>

      {copiedId && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-slate-900 text-white shadow-2xl border border-white/10">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-bold uppercase tracking-widest">Link copied to clipboard</span>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <Card className="relative w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold">New Subscription Plan</CardTitle>
                <CardDescription>Configure pricing and billing cycles.</CardDescription>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Plan Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Professional Tier" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Price (USDC)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        placeholder="29" 
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Interval</label>
                    <select className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none appearance-none transition-colors">
                      <option>Monthly</option>
                      <option>Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Description</label>
                  <textarea 
                    rows={3}
                    placeholder="What's included in this plan?" 
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 <Button 
                    onClick={() => setIsModalOpen(false)}
                    className="h-14 rounded-xl text-sm font-black uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200"
                  >
                    Create Plan
                  </Button>
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest px-8">
                    By creating this plan, it will be immediately available for subscription via smart contract.
                  </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}