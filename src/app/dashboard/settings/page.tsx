
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, sendEmailVerification, type User as FirebaseUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import type { ThemePreference, UserProfile } from '@/lib/types';

const profileSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }), // This is the primary login email
  personalPhone: z.string().optional(),

  // Business Info
  businessName: z.string().optional(),
  businessEmail: z.string().email({ message: 'Invalid business email address.' }).optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  businessWebsite: z.string().url({ message: 'Invalid URL format.' }).optional().or(z.literal('')),
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
      personalPhone: '',
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
      businessWebsite: '',
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
            personalPhone: userData.personalPhone || '',
            businessName: userData.businessName || '',
            businessEmail: userData.businessEmail || '',
            businessPhone: userData.businessPhone || '',
            businessAddress: userData.businessAddress || '',
            businessWebsite: userData.businessWebsite || '',
          });
        } else {
          // Fallback if Firestore doc is missing (should be rare)
          form.reset({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            personalPhone: '',
            businessName: '',
            businessEmail: '',
            businessPhone: '',
            businessAddress: '',
            businessWebsite: '',
          });
        }
        setIsFetchingData(false);
      };
      fetchUserData();
    } else if (!authLoading) {
      setIsFetchingData(false);
    }
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
        email: data.email, // Main login email
        personalPhone: data.personalPhone || '',
        businessName: data.businessName || '',
        businessEmail: data.businessEmail || '',
        businessPhone: data.businessPhone || '',
        businessAddress: data.businessAddress || '',
        businessWebsite: data.businessWebsite || '',
        updatedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, profileDataToSave, { merge: true });

      const currentAuthUser = auth.currentUser as FirebaseUser | null; // Type assertion
      if (currentAuthUser) {
        // Update Firebase Auth display name
        if (currentAuthUser.displayName !== `${data.firstName} ${data.lastName}`) {
          await updateProfile(currentAuthUser, {
            displayName: `${data.firstName} ${data.lastName}`,
          });
        }
        
        // Update Firebase Auth email (if changed and different from current)
        if (currentAuthUser.email !== data.email) {
          try {
            await updateEmail(currentAuthUser, data.email);
            await sendEmailVerification(currentAuthUser);
            toast({
              title: "Login Email Updated",
              description: "Your login email has been updated. A new verification link has been sent. Please verify it.",
              duration: 7000,
            });
          } catch (emailError: any) {
             console.error("Error updating email in Auth:", emailError);
             toast({
                title: "Login Email Update Failed",
                description: `Could not update login email in authentication profile. ${emailError.message}. Other profile details saved.`,
                variant: "destructive",
                duration: 9000,
              });
              // Revert email in form to prevent inconsistent state if auth update fails
              form.setValue('email', currentAuthUser.email || '');
          }
        }
      }
      
      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
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
        {[...Array(3)].map((_, cardIndex) => (
          <Card key={cardIndex}>
            <CardHeader>
              <Skeleton className="h-7 w-1/4 mb-1" />
              <Skeleton className="h-4 w-2/5" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(cardIndex === 0 ? 4 : cardIndex === 1 ? 5 : 1)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
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
        <p className="text-muted-foreground">Manage your personal, business, and appearance settings.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <FormLabel>Login Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                     <p className="text-sm text-muted-foreground">Changing login email will require re-verification.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personalPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
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
            </CardContent>
          </Card>

          {/* Business Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your business information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company LLC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Appearance Card */}
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

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
              {form.formState.isSubmitting ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileSettingsPage;
