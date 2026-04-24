import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletStatus } from "@/components/wallet-status";

type PaymentPageProps = {
  params: {
    slug: string;
  };
};

export default function PaymentPage({ params }: PaymentPageProps) {
  const isDemo = params.slug === "demo";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-slate-500">Subscriber checkout</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          {isDemo ? "Demo payment page" : `Payment page: ${params.slug}`}
        </h2>
        <p className="text-sm text-slate-600">
          Simple placeholder for the future transaction flow. The wallet provider is already
          wired at the app root.
        </p>
      </div>

      <WalletStatus />

      <Card>
        <CardHeader>
          <CardDescription>Checkout target</CardDescription>
          <CardTitle>{isDemo ? "/pay/demo" : `/pay/${params.slug}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>• Merchant and billing data will be loaded here in the next step.</p>
          <p>• Phantom wallet connection support is available through the shared provider.</p>
          <p>• UI stays intentionally minimal so the payment logic can land cleanly later.</p>
        </CardContent>
      </Card>
    </div>
  );
}