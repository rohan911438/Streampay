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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
          Complete Your <span className="text-primary">Subscription</span>
        </h2>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {isDemo ? "Demo Merchant" : "Merchant Platform"}
        </p>
      </div>

      <PaymentPrep isDemo={isDemo} />
    </div>
  );
}