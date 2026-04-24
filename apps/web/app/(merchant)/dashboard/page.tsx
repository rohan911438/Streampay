import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet-status";

const metrics = [
  { label: "Active plans", value: "3" },
  { label: "Subscribers", value: "24" },
  { label: "Monthly revenue", value: "1,240 USDC" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Merchant dashboard</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Subscription control center
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Placeholder shell for plans, payments, and wallet-powered operations.
          </p>
        </div>
        <WalletStatus />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Simple placeholder feed for future billing events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>• New subscription created for demo merchant.</p>
            <p>• Next renewal scheduled for the next billing cycle.</p>
            <p>• Wallet connection is available at the root provider level.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Routes are ready for the next build step.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              href="/plans"
              className="rounded-md bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white"
            >
              Manage plans
            </Link>
            <Link
              href="/analytics"
              className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-900"
            >
              View analytics
            </Link>
            <Link
              href="/pay/demo"
              className="rounded-md border border-dashed border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700"
            >
              Open demo checkout
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}