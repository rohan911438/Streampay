import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentPrep } from "@/components/checkout/payment-prep";

export const dynamic = "force-dynamic";

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
          Connect Phantom and prepare for payment. This step verifies wallet access and public key
          handling before adding transfer logic.
        </p>
      </div>

      <PaymentPrep isDemo={isDemo} />

      <Card>
        <CardHeader>
          <CardDescription>Checkout target</CardDescription>
          <CardTitle>{isDemo ? "/pay/demo" : `/pay/${params.slug}`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>• Merchant and billing data will be loaded here in the next step.</p>
          <p>• Wallet connection state is fully handled with clear connected/disconnected states.</p>
          <p>• Pay action is present but intentionally does not send a transaction yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}