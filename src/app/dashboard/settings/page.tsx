import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Manage your application preferences and settings here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Settings page is under construction.</p>
          <p className="text-muted-foreground mt-2">Future settings could include:</p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 pl-4">
            <li>User profile management</li>
            <li>Notification preferences</li>
            <li>API key management (for Stripe/Daraja if applicable)</li>
            <li>Theme customization (Light/Dark mode toggle)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
