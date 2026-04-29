"use client";

import { useState } from "react";
import { 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  Code, 
  ExternalLink,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeveloperPage() {
  const [apiKey, setApiKey] = useState("sp_live_demo_6b4a2d8e1c");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/5 border border-slate-900/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Terminal className="h-3 w-3" />
            Platform Mode
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase italic">
            Developer <span className="text-slate-300">Portal</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl font-medium leading-relaxed">
            Integrate private payments into your own applications using our powerful APIs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Keys Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Key className="h-32 w-32" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <Key className="text-white h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">API Keys</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authentication credentials</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                    Live Secret Key
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-mono text-sm text-slate-600 flex items-center overflow-hidden">
                      {apiKey}
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-900 transition-all active:scale-95 shadow-sm"
                    >
                      {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-400" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-1 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                    <Shield className="h-3 w-3" />
                    Keep this key secret. Do not share it or expose it in client-side code.
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                 <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-slate-900/20 transition-all active:scale-95">
                    Roll API Key
                 </button>
              </div>
            </div>
          </div>

          {/* Quick Start Card */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute -bottom-10 -right-10 p-8 opacity-10">
              <Code className="h-64 w-64 text-white" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
                  <Terminal className="text-white h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase italic">Quick Start</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">HTTP API Example</p>
                </div>
              </div>

              <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 font-mono text-xs text-white/80 overflow-x-auto leading-relaxed">
                <p className="text-emerald-400"># Fetch your merchant details</p>
                <p>curl -X GET https://streampay.io/api/v1/merchants/me \</p>
                <p>  -H "Authorization: Bearer <span className="text-amber-400">{apiKey}</span>"</p>
                <br />
                <p className="text-emerald-400"># List all payments</p>
                <p>curl -X GET https://streampay.io/api/v1/payments \</p>
                <p>  -H "x-api-key: <span className="text-amber-400">{apiKey}</span>"</p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4 text-[10px] font-black uppercase tracking-[0.2em]">
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Base URL: api.streampay.io
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    JSON REST API
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Webhooks Supported
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Platform Status</h3>
            <div className="space-y-4">
              {[
                { label: "API Gateway", status: "Healthy", icon: Globe },
                { label: "Webhooks", status: "Healthy", icon: Zap },
                { label: "Shielded TX", status: "Active", icon: Shield },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-emerald-600" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-200">
             <h3 className="text-lg font-black tracking-tight uppercase italic">Documentation</h3>
             <p className="text-white/60 text-xs font-medium leading-relaxed">
               Read our comprehensive guides on how to integrate StreamPay into your platform, including SDKs for Node.js, Python, and Go.
             </p>
             <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                API Reference
                <ExternalLink className="h-3 w-3" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
