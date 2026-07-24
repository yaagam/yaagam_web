import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Users operations workspace. Wire this screen to the ops API module when the endpoint contract is finalized.</p>
      </CardContent>
    </Card>
  );
}