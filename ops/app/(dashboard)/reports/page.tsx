import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Reports operations workspace. Wire this screen to the ops API module when the endpoint contract is finalized.</p>
      </CardContent>
    </Card>
  );
}