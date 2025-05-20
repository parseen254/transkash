
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Settings, User, Bell, Palette, KeyRound, Save, Loader2, PlusCircle, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from '@/context/ThemeProvider';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import type { UserSettings, ApiKeyEntry } from '@/lib/types';
import { getUserSettings, updateUserSettings, addApiKey, getUserApiKeys, deleteApiKey } from '@/lib/actions';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name must be less than 50 characters."),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const apiKeyFormSchema = z.object({
  serviceName: z.string().min(2, "Service name is required.").max(50, "Service name too long."),
  keyValue: z.string().min(10, "API Key must be at least 10 characters.").max(256, "API Key too long."),
});
type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [notificationsUpdating, setNotificationsUpdating] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [apiKeySubmitting, setApiKeySubmitting] = useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = useState<string | null>(null);


  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const apiKeyForm = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      serviceName: '',
      keyValue: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    if (user) {
      profileForm.reset({ name: user.displayName || '' });

      const fetchInitialData = async () => {
        setSettingsLoading(true);
        setApiKeysLoading(true);
        try {
          const settings = await getUserSettings(user.uid);
          setUserSettings(settings);
        } catch (e) {
          console.error("Failed to load user settings", e);
          toast({title: "Error", description: "Could not load user settings.", variant: "destructive"})
        } finally {
          setSettingsLoading(false);
        }
        
        try {
          const keys = await getUserApiKeys(user.uid);
          setApiKeys(keys);
        } catch (e) {
          console.error("Failed to load API keys", e);
           toast({title: "Error", description: "Could not load API keys.", variant: "destructive"})
        } finally {
          setApiKeysLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [user, profileForm, toast]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth.currentUser) { // auth.currentUser for direct updateProfile
      toast({ title: "Error", description: "You must be signed in to update your profile.", variant: "destructive" });
      return;
    }
    setProfileUpdating(true);
    try {
      await updateProfile(auth.currentUser, { displayName: data.name });
      // AuthContext should pick up the change via onAuthStateChanged, or you can manually update user in context
      toast({
        title: "Profile Updated",
        description: `Display name changed to ${data.name}.`,
      });
      // Optionally, force re-fetch of user in AuthContext if not auto-updating displayName
    } catch (error) {
      console.error("Profile update error:", error);
      toast({ title: "Update Failed", description: "Could not update your display name.", variant: "destructive" });
    } finally {
      setProfileUpdating(false);
    }
  };

  const handleNotificationChange = async (type: keyof Omit<UserSettings, 'userId'>, checked: boolean) => {
    if (!user || !userSettings) return;
    setNotificationsUpdating(true);
    // Optimistically update UI
    const oldSettings = {...userSettings};
    setUserSettings(prev => prev ? {...prev, [type]: checked} : null);

    const result = await updateUserSettings(user.uid, { [type]: checked });
    if (result.success) {
      toast({
        title: "Notification Settings Updated",
        description: `${type === 'emailNotifications' ? 'Email' : 'SMS'} notifications ${checked ? 'enabled' : 'disabled'}.`,
      });
    } else {
      // Revert optimistic update on failure
      setUserSettings(oldSettings);
      toast({ title: "Update Failed", description: result.message || "Could not update notification settings.", variant: "destructive"});
    }
    setNotificationsUpdating(false);
  };

  const onApiKeySubmit = async (data: ApiKeyFormValues) => {
    if (!user) return;
    setApiKeySubmitting(true);
    const result = await addApiKey(user.uid, data.serviceName, data.keyValue);
    if (result.success && result.apiKeyId) {
      const newKey: ApiKeyEntry = {
        id: result.apiKeyId,
        userId: user.uid,
        serviceName: data.serviceName,
        keyValue: data.keyValue, 
        createdAt: new Date().toISOString(), 
      };
      setApiKeys(prev => [newKey, ...prev].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      toast({ title: "API Key Added", description: `Key for ${data.serviceName} added successfully.` });
      apiKeyForm.reset();
    } else {
      toast({ title: "Failed to Add API Key", description: result.message || "An error occurred.", variant: "destructive" });
    }
    setApiKeySubmitting(false);
  };

  const handleDeleteApiKey = async () => {
    if (!user || !apiKeyToDelete) return;
    const keyId = apiKeyToDelete;
    setApiKeyToDelete(null); 

    const result = await deleteApiKey(user.uid, keyId);
    if (result.success) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      toast({ title: "API Key Deleted", description: result.message });
    } else {
      toast({ title: "Failed to Delete API Key", description: result.message || "An error occurred.", variant: "destructive" });
    }
  };

  const maskApiKey = (key: string) => {
    if(!key) return '****';
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
  };


  if (!isMounted || authLoading || !user) { // Ensure user is loaded before rendering form dependent on user data
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><KeyRound className="mr-2 h-5 w-5 text-primary" /> API Key Management</CardTitle>
          <CardDescription>Manage API keys for external services. Ensure your Firestore Security Rules are properly configured.</CardDescription>
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
                  <p>API keys grant access to external services. Handle them with extreme care. Never share secret keys. This interface is for managing keys this application might use on your behalf (e.g., for server-to-server integrations). For highly sensitive keys like payment processor secret keys, a backend-managed vault is recommended.</p>
                </div>
              </div>
            </div>
          </div>

          <Form {...apiKeyForm}>
            <form onSubmit={apiKeyForm.handleSubmit(onApiKeySubmit)} className="space-y-4 mb-6 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Add New API Key</h3>
              <FormField
                control={apiKeyForm.control}
                name="serviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Analytics Service" {...field} />
                    </FormControl>
                    <FormDescription>A recognizable name for this API key.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={apiKeyForm.control}
                name="keyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key Value</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter the API key" {...field} />
                    </FormControl>
                    <FormDescription>The actual API key. It will be stored securely.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={apiKeySubmitting || authLoading}>
                {apiKeySubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                {apiKeySubmitting ? "Adding..." : "Add API Key"}
              </Button>
            </form>
          </Form>

          <h3 className="text-lg font-medium mb-2">Your API Keys</h3>
          {apiKeysLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{key.serviceName}</p>
                    <p className="text-sm text-muted-foreground">Key: {maskApiKey(key.keyValue)}</p>
                    <p className="text-xs text-muted-foreground">Added: {new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setApiKeyToDelete(key.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No API keys added yet.</p>
          )}
        </CardContent>
      </Card>
       <AlertDialog open={!!apiKeyToDelete} onOpenChange={(open) => !open && setApiKeyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the API key
                for "{apiKeys.find(k => k.id === apiKeyToDelete)?.serviceName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setApiKeyToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteApiKey} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    