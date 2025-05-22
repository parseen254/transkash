
"use client";

import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

const SecuritySettingsPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoadingUserSettings, setIsLoadingUserSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchUserSettings = async () => {
        setIsLoadingUserSettings(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          setIs2FAEnabled(userData.is2FAEnabled || false);
        }
        setIsLoadingUserSettings(false);
      };
      fetchUserSettings();
    } else if (!authLoading) {
      setIsLoadingUserSettings(false);
    }
  }, [user, authLoading]);

  const handleToggle2FA = async (enabled: boolean) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { 
        is2FAEnabled: enabled,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setIs2FAEnabled(enabled);
      toast({
        title: "Security Setting Updated",
        description: `Two-Factor Authentication has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error("Error updating 2FA status:", error);
      toast({
        title: "Update Failed",
        description: "Could not update 2FA status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const isLoading = authLoading || isLoadingUserSettings;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-1/3 mb-1" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-1/4 mb-1" />
            <Skeleton className="h-4 w-2/5" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-5 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user && !authLoading && !isLoadingUserSettings) {
     return (
        <div className="space-y-6">
          <p>Please log in to manage security settings.</p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Security Settings</h1>
        <p className="text-muted-foreground">Manage your account security options.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription>
            Enhance your account security by requiring a second factor of authentication via email OTP after password login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="2fa-toggle"
              checked={is2FAEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={isSaving}
              aria-label="Toggle Two-Factor Authentication"
            />
            <Label htmlFor="2fa-toggle" className="text-base">
              {is2FAEnabled ? '2FA Enabled' : '2FA Disabled'}
            </Label>
          </div>
          {is2FAEnabled && (
            <p className="mt-4 text-sm text-muted-foreground">
              When enabled, you will be asked to enter a One-Time Password (OTP) sent to your email address after successfully entering your password.
            </p>
          )}
           <p className="mt-2 text-xs text-muted-foreground">
              Note: The OTP generation and email sending would be handled by a backend service (e.g., Firebase Functions) in a production environment. This demo simulates the flow.
            </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettingsPage;
