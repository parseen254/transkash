
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, User, Bell, Palette, KeyRound, Save, Loader2 } from "lucide-react";
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import type { UserSettings } from '@/lib/types';
import { getUserSettings, updateUserSettings } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be less than 50 characters."),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      profileForm.reset({ name: user.displayName || '' });
      
      const fetchSettings = async () => {
        setSettingsLoading(true);
        const settings = await getUserSettings(user.uid);
        setUserSettings(settings);
        setSettingsLoading(false);
      };
      fetchSettings();
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "You must be signed in to update your profile.", variant: "destructive" });
      return;
    }
    setProfileUpdating(true);
    try {
      await updateProfile(user, { displayName: data.name });
      toast({
        title: "Profile Updated",
        description: `Display name changed to ${data.name}.`,
      });
      // Manually trigger re-render of components using user.displayName if needed,
      // or rely on AuthContext to eventually update. For immediate effect:
      profileForm.reset({ name: data.name }); 
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ title: "Update Failed", description: "Could not update your display name.", variant: "destructive" });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleNotificationChange = async (type: keyof UserSettings, checked: boolean) => {
    if (!user || !userSettings) return;
    setNotificationsUpdating(true);
    const newSettings = { ...userSettings, [type]: checked };
    
    const result = await updateUserSettings(user.uid, { [type]: checked });
    if (result.success) {
      setUserSettings(newSettings); // Optimistic update or re-fetch
      toast({
        title: "Notification Settings Updated",
        description: `${type === 'emailNotifications' ? 'Email' : 'SMS'} notifications ${checked ? 'enabled' : 'disabled'}.`,
      });
    } else {
      toast({ title: "Update Failed", description: result.message || "Could not update notification settings.", variant: "destructive"});
    }
    setNotificationsUpdating(false);
  };

  if (!isMounted || authLoading) {
    // Avoid hydration mismatch for theme toggle and wait for auth
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-y-2">
            <Label htmlFor="dark-mode-switch" className="text-base">Dark Mode</Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Switch between light and dark themes.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary" /> User Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" value={user?.email || ''} readOnly disabled className="cursor-not-allowed bg-muted/50"/>
                </FormControl>
                <FormDescription>Your email address is used for login and cannot be changed here.</FormDescription>
              </FormItem>
              <Button type="submit" className="shadow-md hover:shadow-lg" disabled={profileUpdating}>
                {profileUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {profileUpdating ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary" /> Notification Preferences</CardTitle>
          <CardDescription>Choose how you receive notifications from us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <>
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </>
          ) : userSettings ? (
            <>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about your transfers and account activity via email.</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={userSettings.emailNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                  aria-label="Toggle email notifications"
                  disabled={notificationsUpdating}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="sms-notifications" className="text-base font-medium">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get important alerts about transfer statuses via SMS (if applicable).</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={userSettings.smsNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                  aria-label="Toggle SMS notifications"
                  disabled={notificationsUpdating}
                />
              </div>
               {notificationsUpdating && <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating preferences...</div>}
            </>
          ) : (
             <p className="text-muted-foreground">Could not load notification settings.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> API Key Management</CardTitle>
          <CardDescription>Manage API keys for third-party service integrations.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Securely managing API keys typically requires a dedicated backend service. For security reasons, direct client-side management of sensitive keys like Stripe or Daraja API keys is not implemented here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
