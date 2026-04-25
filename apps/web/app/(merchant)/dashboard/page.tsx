import { getDodoWebhookSnapshot } from "@/lib/dodo-webhook-state";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet-status";

const metrics = [
  { label: "Active plans", value: "3" },
  { label: "Subscribers", value: "24" },
  { label: "Monthly revenue", value: "1,240 USDC" },
];

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const webhookSnapshot = getDodoWebhookSnapshot();

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
            <CardDescription>Latest Dodo webhook events captured by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {webhookSnapshot.latestEvents.length > 0 ? (
              webhookSnapshot.latestEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-medium text-slate-900">{event.eventType}</p>
                  <p className="text-xs text-slate-500">{event.receivedAt}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {event.subscriptionId ? `Subscription: ${event.subscriptionId}` : "Subscription: not provided"}
                  </p>
                  <p className="text-sm text-slate-600">
                    {event.customerEmail ? `Customer: ${event.customerEmail}` : "Customer email not provided"}
                  </p>
                </div>
              ))
            ) : (
              <>
                <p>• Waiting for the first Dodo webhook event.</p>
                <p>• Configure the webhook URL in the Dodo dashboard to start streaming events.</p>
                <p>• Incoming events update the in-memory subscription snapshot here.</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook state</CardTitle>
            <CardDescription>Current subscription snapshots updated by webhook events.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {webhookSnapshot.subscriptions.length > 0 ? (
              webhookSnapshot.subscriptions.slice(0, 3).map((subscription) => (
                <div key={subscription.recordKey} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">
                    {subscription.subscriptionId ?? subscription.customerEmail ?? subscription.recordKey}
                  </p>
                  <p className="text-xs text-slate-500">{subscription.customerEmail ?? "No customer email"}</p>
                  <p className="mt-2">Status: {subscription.status}</p>
                  <p>Last event: {subscription.lastEventType}</p>
                  <p>Payments seen: {subscription.paymentCount}</p>
                </div>
              ))
            ) : (
              <p>No subscription snapshots yet.</p>
            )}
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