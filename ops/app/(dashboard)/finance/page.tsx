import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FinancePage() {
  return (
    <Card>
      <CardHeader><CardTitle>Finance</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Finance operations workspace. Wire this screen to the ops API module when the endpoint contract is finalized.</p>
      </CardContent>
    </Card>
  );
}