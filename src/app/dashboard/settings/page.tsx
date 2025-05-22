
"use client";

import type { NextPage } from 'next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth'; // Added updateEmail and sendEmailVerification
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  businessName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileSettingsPage: NextPage = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
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
          const userData = userDocSnap.data();
          form.reset({
            firstName: userData.firstName || user.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            email: userData.email || user.email || '', // Prefer Firestore email, fallback to auth email
            phone: userData.phone || '',
            businessName: userData.businessName || '',
          });
        } else {
          // Fallback if Firestore doc doesn't exist but user is authenticated
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
      // User is not logged in and auth is not loading
      setIsFetchingData(false);
       // router.push('/login'); // Or handle appropriately
    }
  }, [user, authLoading, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }

    try {
      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email, // Storing email in Firestore as well
        phone: data.phone || '',
        businessName: data.businessName || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Update Firebase Auth profile (displayName and email)
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        await updateProfile(currentAuthUser, {
          displayName: `${data.firstName} ${data.lastName}`,
        });
        
        if (currentAuthUser.email !== data.email) {
          // Email change requires re-authentication for some providers or recent sign-in
          // For simplicity, we'll try to update and let Firebase handle errors.
          // A more robust flow would prompt for password if required.
          try {
            await updateEmail(currentAuthUser, data.email);
            // Email updated, send new verification email
            await sendEmailVerification(currentAuthUser);
            toast({
              title: "Email Updated",
              description: "Your email has been updated. A new verification link has been sent to your new email address. Please verify it.",
              duration: 7000,
            });
          } catch (emailError: any) {
             console.error("Error updating email in Auth:", emailError);
             toast({
                title: "Email Update Failed",
                description: `Could not update email in authentication profile. ${emailError.message}. Your profile details (name, phone, business) were saved.`,
                variant: "destructive",
                duration: 9000,
              });
              // Revert email in form if auth update failed but Firestore succeeded for email
              form.setValue('email', currentAuthUser.email || '');
          }
        }
      }
      
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            </div>
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
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
    </div>
  );
};

export default ProfileSettingsPage;
