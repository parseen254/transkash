
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { ThemePreference, UserProfile } from '@/lib/types';

const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  businessName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSettingsPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isFetchingData, setIsFetchingData] = useState(true);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      businessName: '',
    },
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setIsFetchingData(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          form.reset({
            firstName: userData.firstName || user.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            email: userData.email || user.email || '',
            phone: userData.phone || '',
            businessName: userData.businessName || '',
          });
          // Theme is now fully managed by ThemeProvider, no need to set it here.
        } else {
          form.reset({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            phone: '',
            businessName: '',
          });
        }
        setIsFetchingData(false);
      };
      fetchUserData();
    } else if (!authLoading) {
      setIsFetchingData(false); // Also set to false if no user and auth isn't loading
    }
  // Removed theme and setTheme from deps as ThemeProvider handles theme sync.
  // form is stable from useForm. router is stable.
  }, [user, authLoading, form, router]);


  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      const profileDataToSave: Partial<UserProfile> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        businessName: data.businessName || '',
        updatedAt: serverTimestamp(),
        // themePreference is saved by setTheme (from useTheme hook via RadioGroup)
      };

      await setDoc(userDocRef, profileDataToSave, { merge: true });

      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        await updateProfile(currentAuthUser, {
          displayName: `${data.firstName} ${data.lastName}`,
        });
        
        if (currentAuthUser.email !== data.email) {
          try {
            await updateEmail(currentAuthUser, data.email);
            await sendEmailVerification(currentAuthUser);
            toast({
              title: "Email Updated",
              description: "Your email has been updated. A new verification link has been sent. Please verify it.",
              duration: 7000,
            });
          } catch (emailError: any) {
             console.error("Error updating email in Auth:", emailError);
             toast({
                title: "Email Update Failed",
                description: `Could not update email in authentication profile. ${emailError.message}. Profile details saved.`,
                variant: "destructive",
                duration: 9000,
              });
              form.setValue('email', currentAuthUser.email || '');
          }
        }
      }
      
      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };
  
  const isLoading = authLoading || isFetchingData;

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
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-7 w-1/4 mb-1" /><Skeleton className="h-4 w-2/5" /></CardHeader>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  if (!user && !authLoading && !isFetchingData) {
     return (
        <div className="space-y-6">
          <p>Please log in to view your settings.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account details and preferences.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                     <p className="text-sm text-muted-foreground">Changing email will require re-verification.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company LLC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <Label>Account Status</Label>
                <Input 
                  readOnly 
                  value={user?.emailVerified ? "Verified" : "Not Verified"} 
                  className={`bg-muted border-muted-foreground/30 cursor-not-allowed ${user?.emailVerified ? 'text-green-600' : 'text-orange-600'}`}
                />
                {!user?.emailVerified && (
                  <p className="text-sm text-muted-foreground">
                    Your email is not verified. Check your inbox for a verification link, or update your email to resend.
                  </p>
                )}
              </FormItem>
              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme} 
            onValueChange={(value) => setTheme(value as ThemePreference)}
            className="space-y-2"
          >
            <Label htmlFor="theme-light" className="flex items-center space-x-2 cursor-pointer">
              <RadioGroupItem value="light" id="theme-light" />
              <span>Light</span>
            </Label>
            <Label htmlFor="theme-dark" className="flex items-center space-x-2 cursor-pointer">
              <RadioGroupItem value="dark" id="theme-dark" />
              <span>Dark</span>
            </Label>
            <Label htmlFor="theme-system" className="flex items-center space-x-2 cursor-pointer">
              <RadioGroupItem value="system" id="theme-system" />
              <span>System</span>
            </Label>
          </RadioGroup>
          <p className="text-sm text-muted-foreground mt-2">
            Current active theme: {resolvedTheme}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsPage;
