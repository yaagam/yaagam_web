import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPanel() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue="Operations Operator" /></div>
          <div className="space-y-2"><Label>Email</Label><Input defaultValue="ops@yaagam.in" /></div>
          <Button>Save Profile</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Password change</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current password</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>New password</Label><Input type="password" /></div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Enable 2FA</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Authenticator setup placeholder for TOTP enrollment.</p>
          <Button variant="outline">Start 2FA Setup</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border p-3 text-sm">Current browser session</div>
          <Button variant="destructive">Revoke Other Sessions</Button>
        </CardContent>
      </Card>
    </div>
  );
}