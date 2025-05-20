
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, User, Bell, Palette, KeyRound, Save, Loader2, AlertTriangle, PlusCircle, Trash2 } from "lucide-react";
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import type { UserSettings, ApiKeyEntry } from '@/lib/types';
import { getUserSettings, updateUserSettings, addApiKey, getUserApiKeys, deleteApiKey as deleteApiKeyAction } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
// AlertDialog related imports are removed as the dialog is being removed.

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be less than 50 characters."),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const paymentKeysFormSchema = z.object({
  stripeApiKey: z.string().optional().or(z.literal('')),
  darajaApiKey: z.string().optional().or(z.literal('')),
});
type PaymentKeysFormValues = z.infer<typeof paymentKeysFormSchema>;

const addApiKeyFormSchema = z.object({
  serviceName: z.string().min(2, "Service name must be at least 2 characters.").max(50),
  keyValue: z.string().min(10, "API Key must be at least 10 characters.").max(200), // Adjusted max length
});
type AddApiKeyFormValues = z.infer<typeof addApiKeyFormSchema>;

const defaultUserSettingsForForm: UserSettings = {
  emailNotifications: true,
  smsNotifications: false,
  stripeApiKey: '',
  darajaApiKey: '',
};

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, auth, loading: authLoading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);
  const [paymentKeysUpdating, setPaymentKeysUpdating] = useState(false);

  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(true);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '' },
  });

  const paymentKeysForm = useForm<PaymentKeysFormValues>({
    resolver: zodResolver(paymentKeysFormSchema),
    defaultValues: { stripeApiKey: '', darajaApiKey: '' },
  });

  const addApiKeyForm = useForm<AddApiKeyFormValues>({
    resolver: zodResolver(addApiKeyFormSchema),
    defaultValues: { serviceName: '', keyValue: '' },
  });

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      profileForm.reset({ name: user.displayName || '' });

      const fetchInitialData = async () => {
        setSettingsLoading(true);
        setLoadingApiKeys(true);
        try {
          const settings = await getUserSettings(user.uid);
          setUserSettings(settings);
          paymentKeysForm.reset({
            stripeApiKey: settings.stripeApiKey || '',
            darajaApiKey: settings.darajaApiKey || '',
          });

          const keys = await getUserApiKeys(user.uid);
          setApiKeys(keys);

        } catch (e) {
          console.error("Failed to load user settings or API keys", e);
          toast({ title: "Error", description: "Could not load user settings or API keys.", variant: "destructive" });
        } finally {
          setSettingsLoading(false);
          setLoadingApiKeys(false);
        }
      };
      fetchInitialData();
    }
  }, [user, profileForm, paymentKeysForm, toast]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth?.currentUser) {
      toast({ title: "Error", description: "You must be signed in to update your profile.", variant: "destructive" });
      return;
    }
    setProfileUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.name });
      toast({ title: "Profile Updated", description: `Display name changed to ${data.name}.` });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ title: "Update Failed", description: "Could not update your display name.", variant: "destructive" });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleNotificationChange = async (type: 'emailNotifications' | 'smsNotifications', checked: boolean) => {
    if (!user || !userSettings) return;
    setNotificationsUpdating(true);
    const oldSettings = { ...userSettings };
    setUserSettings(prev => prev ? { ...prev, [type]: checked } : null);

    const result = await updateUserSettings(user.uid, { [type]: checked });
    if (result.success) {
      toast({ title: "Notification Settings Updated", description: `${type === 'emailNotifications' ? 'Email' : 'SMS'} notifications ${checked ? 'enabled' : 'disabled'}.` });
    } else {
      setUserSettings(oldSettings);
      toast({ title: "Update Failed", description: result.message || "Could not update notification settings.", variant: "destructive" });
    }
    setNotificationsUpdating(false);
  };

  const onPaymentKeysSubmit = async (data: PaymentKeysFormValues) => {
    if (!user) return;
    setPaymentKeysUpdating(true);
    const settingsToUpdate: Partial<UserSettings> = {
      stripeApiKey: data.stripeApiKey || '',
      darajaApiKey: data.darajaApiKey || '',
    };
    const result = await updateUserSettings(user.uid, settingsToUpdate);
    if (result.success) {
      toast({ title: "API Keys Updated", description: "Your payment gateway API keys have been saved." });
      setUserSettings(prev => ({ ...(prev || defaultUserSettingsForForm), ...settingsToUpdate }));
      paymentKeysForm.reset({ stripeApiKey: '', darajaApiKey: '' }); // Clear fields after successful save
    } else {
      toast({ title: "Update Failed", description: result.message || "Could not update API keys.", variant: "destructive" });
    }
    setPaymentKeysUpdating(false);
  };

  const handleAddNewApiKey = async (data: AddApiKeyFormValues) => {
    if (!user) return;
    setIsAddingApiKey(true);
    const result = await addApiKey(user.uid, data.serviceName, data.keyValue);
    if (result.success && result.apiKey) {
      toast({ title: "API Key Added", description: `${data.serviceName} key saved.` });
      setApiKeys(prev => [...prev, result.apiKey!].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      addApiKeyForm.reset();
    } else {
      toast({ title: "Failed to Add Key", description: result.message || "Could not save API key.", variant: "destructive" });
    }
    setIsAddingApiKey(false);
  };

  const handleDirectDeleteApiKey = async (keyId: string) => {
    if (!user) return;
    setDeletingKeyId(keyId);
    const result = await deleteApiKeyAction(user.uid, keyId);
    if (result.success) {
      toast({ title: "API Key Deleted", description: result.message });
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
    } else {
      toast({ title: "Deletion Failed", description: result.message || "Could not delete API key.", variant: "destructive" });
    }
    setDeletingKeyId(null);
  };

  const maskApiKey = (key?: string) => {
    if (!key || key.length === 0) return 'Not Set';
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  };

  if (!isMounted || authLoading || !user) {
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
              {i === 0 && <Skeleton className="h-10 w-full mt-2" />}
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
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> Payment Gateway API Keys</CardTitle>
          <CardDescription>Manage your Stripe and Daraja API keys. Ensure your Firestore Security Rules are properly configured to protect these keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Security Warning</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>API keys grant access to external services and financial transactions. Handle them with extreme care. Never share secret keys publicly or commit them to version control. For production systems, consider storing highly sensitive keys (like Stripe secret keys) in a secure backend vault (e.g., Google Secret Manager) accessed only by server-side functions, not directly by client-side code.</p>
                </div>
              </div>
            </div>
          </div>
          {settingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          ) : (
            <Form {...paymentKeysForm}>
              <form onSubmit={paymentKeysForm.handleSubmit(onPaymentKeysSubmit)} className="space-y-6">
                <FormField
                  control={paymentKeysForm.control}
                  name="stripeApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stripe API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="sk_live_... or sk_test_..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Current: {maskApiKey(userSettings?.stripeApiKey)} (Enter new key to update, or leave blank to keep current. Enter a single space then backspace to clear.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentKeysForm.control}
                  name="darajaApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daraja API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter Daraja API Key" {...field} />
                      </FormControl>
                      <FormDescription>
                        Current: {maskApiKey(userSettings?.darajaApiKey)} (Enter new key to update, or leave blank to keep current. Enter a single space then backspace to clear.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="shadow-md hover:shadow-lg" disabled={paymentKeysUpdating || authLoading}>
                  {paymentKeysUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {paymentKeysUpdating ? 'Saving Keys...' : 'Save API Keys'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      {/* Generic API Key Management Card - Retained as per original file structure if this specific popup is the target */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> Other API Key Management</CardTitle>
          <CardDescription>Manage other API keys you might use with the application. Use strong, unique keys.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-md mb-6">
             <div className="flex">
               <div className="flex-shrink-0">
                 <AlertTriangle className="h-5 w-5 text-yellow-400" />
               </div>
               <div className="ml-3">
                 <h3 className="text-sm font-medium text-yellow-800">Security Reminder</h3>
                 <div className="mt-2 text-sm text-yellow-700">
                   <p>Always handle API keys with care. Ensure your Firestore security rules are properly configured to protect these keys and that they are only accessible by authorized users/processes.</p>
                 </div>
               </div>
             </div>
           </div>

          <Form {...addApiKeyForm}>
            <form onSubmit={addApiKeyForm.handleSubmit(handleAddNewApiKey)} className="space-y-4 mb-6">
              <FormField
                control={addApiKeyForm.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl><Input placeholder="e.g., WeatherAPI, AnalyticsService" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addApiKeyForm.control}
                name="keyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key Value</FormLabel>
                    <FormControl><Input type="password" placeholder="Enter the API key" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="shadow-md" disabled={isAddingApiKey}>
                {isAddingApiKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {isAddingApiKey ? 'Adding Key...' : 'Add API Key'}
              </Button>
            </form>
          </Form>

          {loadingApiKeys ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apiKeys.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-md font-medium">Saved API Keys:</h4>
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">{key.serviceName}</p>
                    <p className="text-sm text-muted-foreground">Key: {maskApiKey(key.keyValue)}</p>
                    <p className="text-xs text-muted-foreground">Added: {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDirectDeleteApiKey(key.id)}
                    disabled={deletingKeyId === key.id}
                  >
                    {deletingKeyId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No generic API keys added yet.</p>
          )}
        </CardContent>
      </Card>


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
              <Button type="submit" className="shadow-md hover:shadow-lg" disabled={profileUpdating || authLoading}>
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
    </div>
  );
}
