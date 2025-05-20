
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, User, Bell, Palette, KeyRound, Save } from "lucide-react";
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from "@/hooks/use-toast";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be less than 50 characters."),
  email: z.string().email("Invalid email address.").optional(), // Assuming email might be display-only
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  // Mock user data and notification preferences
  const [userProfile, setUserProfile] = useState({ name: 'Demo User', email: 'user@example.com' });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile.name,
      email: userProfile.email,
    },
  });

  useEffect(() => {
    setIsMounted(true);
    // In a real app, fetch user profile and notification settings here
    profileForm.reset({ name: userProfile.name, email: userProfile.email });
  }, [profileForm, userProfile.name, userProfile.email]);


  const onProfileSubmit = (data: ProfileFormValues) => {
    setUserProfile(prev => ({ ...prev, name: data.name })); // Update local state
    toast({
      title: "Profile Updated",
      description: `Name changed to ${data.name}.`,
    });
  };

  const handleNotificationChange = (type: 'email' | 'sms', checked: boolean) => {
    if (type === 'email') setEmailNotifications(checked);
    if (type === 'sms') setSmsNotifications(checked);
    toast({
      title: "Notification Settings Updated",
      description: `${type === 'email' ? 'Email' : 'SMS'} notifications ${checked ? 'enabled' : 'disabled'}.`,
    });
  };

  if (!isMounted) {
    // Avoid hydration mismatch for theme toggle
    return null; 
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Settings className="mr-3 h-8 w-8 text-primary" />
          Settings
        </h1>
      </div>

      {/* Appearance Settings Card */}
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

      {/* Profile Settings Card */}
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
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} readOnly disabled className="cursor-not-allowed bg-muted/50"/>
                    </FormControl>
                     <FormDescription>Your email address is used for login and cannot be changed here.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="shadow-md hover:shadow-lg">
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary" /> Notification Preferences</CardTitle>
          <CardDescription>Choose how you receive notifications from us.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="email-notifications" className="text-base font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive updates about your transfers and account activity via email.</p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              aria-label="Toggle email notifications"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="sms-notifications" className="text-base font-medium">SMS Notifications</Label>
               <p className="text-sm text-muted-foreground">Get important alerts about transfer statuses via SMS (if applicable).</p>
            </div>
            <Switch
              id="sms-notifications"
              checked={smsNotifications}
              onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
              aria-label="Toggle SMS notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Key Management Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> API Key Management</CardTitle>
          <CardDescription>Manage API keys for integrations (Stripe/Daraja).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section is under construction. API key management will allow you to securely manage keys for any connected services.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
