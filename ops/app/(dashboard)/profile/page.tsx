import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Profile operations workspace. Wire this screen to the ops API module when the endpoint contract is finalized.</p>
      </CardContent>
    </Card>
  );
}