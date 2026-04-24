import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Merchant section</CardDescription>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Placeholder analytics surface for future revenue, churn, and wallet health views.
      </CardContent>
    </Card>
  );
}