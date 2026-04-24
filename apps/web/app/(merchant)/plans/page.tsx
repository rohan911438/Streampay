import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlansPage() {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Merchant section</CardDescription>
        <CardTitle>Plans</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Minimal placeholder for recurring billing plans and pricing rules.
      </CardContent>
    </Card>
  );
}