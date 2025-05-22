
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updateEmail, sendEmailVerification, type User as FirebaseUser } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';

import { db, auth, storage } from '@/lib/firebase'; // Ensure storage is exported from firebase.ts
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ThemePreference, UserProfile } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner'; // Assuming you have a spinner component

const personalInfoSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  personalPhone: z.string().optional(),
});

const businessInfoSchema = z.object({
  businessName: z.string().optional(),
  businessEmail: z.string().email({ message: 'Invalid business email address.' }).optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  businessWebsite: z.string().url({ message: 'Invalid URL format.' }).optional().or(z.literal('')),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

const ProfileSettingsPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, initialLoadComplete } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const personalForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      personalPhone: '',
    },
  });

  const businessForm = useForm<BusinessInfoFormValues>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: '',
      businessEmail: '',
      businessPhone: '',
      businessAddress: '',
      businessWebsite: '',
    },
  });

  useEffect(() => {
    if (user && initialLoadComplete) {
      const fetchUserData = async () => {
        setIsFetchingData(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as UserProfile;
          personalForm.reset({
            firstName: userData.firstName || user.displayName?.split(' ')[0] || '',
            lastName: userData.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
            email: userData.email || user.email || '',
            personalPhone: userData.personalPhone || '',
          });
          businessForm.reset({
            businessName: userData.businessName || '',
            businessEmail: userData.businessEmail || '',
            businessPhone: userData.businessPhone || '',
            businessAddress: userData.businessAddress || '',
            businessWebsite: userData.businessWebsite || '',
          });
          if (userData.photoURL) {
            setAvatarPreview(userData.photoURL);
          }
        } else {
          // Fallback if Firestore doc is missing
          personalForm.reset({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
          });
           if (user.photoURL) {
            setAvatarPreview(user.photoURL);
          }
        }
        setIsFetchingData(false);
      };
      fetchUserData();
    } else if (!authLoading && initialLoadComplete) {
      setIsFetchingData(false); // No user, so no data to fetch
    }
  }, [user, authLoading, initialLoadComplete, personalForm, businessForm]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onPersonalSubmit = async (data: PersonalInfoFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    setIsUploading(true);

    try {
      let newPhotoURL = user.photoURL; // Keep current if no new avatar
      
      if (avatarFile) {
        const imageRef = storageRef(storage, `user-avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(imageRef, avatarFile);
        newPhotoURL = await getDownloadURL(imageRef);
        setAvatarPreview(newPhotoURL); // Update preview to new uploaded URL
        setAvatarFile(null); // Clear the file state
      }

      const userDocRef = doc(db, "users", user.uid);
      const profileDataToSave: Partial<UserProfile> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        personalPhone: data.personalPhone || '',
        photoURL: newPhotoURL, // Save the new or existing photoURL
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, profileDataToSave, { merge: true });

      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        await updateProfile(currentAuthUser, {
          displayName: `${data.firstName} ${data.lastName}`,
          photoURL: newPhotoURL,
        });
        
        if (currentAuthUser.email !== data.email) {
          try {
            await updateEmail(currentAuthUser, data.email);
            await sendEmailVerification(currentAuthUser);
            toast({
              title: "Login Email Updated",
              description: "Your login email has been updated. A new verification link has been sent.",
              duration: 7000,
            });
          } catch (emailError: any) {
             console.error("Error updating email in Auth:", emailError);
             toast({
                title: "Login Email Update Failed",
                description: `Could not update login email. ${emailError.message}. Other details saved.`,
                variant: "destructive", duration: 9000,
              });
              personalForm.setValue('email', currentAuthUser.email || '');
          }
        }
      }
      
      toast({
        title: "Personal Info Updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      console.error('Personal info update error:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your personal information.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onBusinessSubmit = async (data: BusinessInfoFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const businessDataToSave: Partial<UserProfile> = {
        businessName: data.businessName || '',
        businessEmail: data.businessEmail || '',
        businessPhone: data.businessPhone || '',
        businessAddress: data.businessAddress || '',
        businessWebsite: data.businessWebsite || '',
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, businessDataToSave, { merge: true });
      toast({
        title: "Business Info Updated",
        description: "Your business information has been saved successfully.",
      });
    } catch (error) {
      console.error('Business info update error:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your business information.",
        variant: "destructive",
      });
    }
  };
  
  const isLoading = authLoading || isFetchingData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-9 w-1/3 mb-1" /><Skeleton className="h-5 w-1/2" /></div>
        <Card><CardHeader><Skeleton className="h-7 w-1/4 mb-1" /><Skeleton className="h-4 w-2/5" /></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-10 w-32" /></div>
            {[...Array(3)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}
            <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
          </CardContent>
        </Card>
        <Card><CardHeader><Skeleton className="h-7 w-1/4 mb-1" /><Skeleton className="h-4 w-2/5" /></CardHeader>
          <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}
            <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
          </CardContent>
        </Card>
        <Card><CardHeader><Skeleton className="h-7 w-1/4 mb-1" /><Skeleton className="h-4 w-2/5" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!user && !authLoading && !isFetchingData) {
     return (<div className="space-y-6"><p>Please log in to view your settings.</p><Button onClick={() => router.push('/login')}>Go to Login</Button></div>);
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal, business, and appearance settings.</p>
      </div>
      
      {/* Personal Information Card */}
      <Form {...personalForm}>
        <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 text-3xl">
                    <AvatarImage src={avatarPreview || user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback>{user ? getInitials(user.displayName) : 'U'}</AvatarFallback>
                  </Avatar>
                  {isUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><Spinner className="text-white" /></div>}
                </div>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  Change Avatar
                </Button>
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={personalForm.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={personalForm.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={personalForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Login Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                <p className="text-sm text-muted-foreground">Changing login email may require re-verification.</p><FormMessage /></FormItem>
              )} />
              <FormField control={personalForm.control} name="personalPhone" render={({ field }) => (
                <FormItem><FormLabel>Personal Phone Number</FormLabel><FormControl><Input placeholder="+1 234 567 8900" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormItem>
                <Label>Account Status</Label>
                <Input readOnly value={user?.emailVerified ? "Verified" : "Not Verified"} 
                  className={`bg-muted cursor-not-allowed ${user?.emailVerified ? 'text-green-600' : 'text-orange-600'}`} />
                {!user?.emailVerified && (<p className="text-sm text-muted-foreground">Your email is not verified.</p>)}
              </FormItem>
              <div className="flex justify-end">
                <Button type="submit" disabled={personalForm.formState.isSubmitting || isUploading}>
                  {personalForm.formState.isSubmitting || isUploading ? (<><Spinner className="mr-2 h-4 w-4" /> Saving...</>) : 'Save Personal Info'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Business Information Card */}
      <Form {...businessForm}>
        <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Manage your business information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={businessForm.control} name="businessName" render={({ field }) => (
                <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={businessForm.control} name="businessEmail" render={({ field }) => (
                <FormItem><FormLabel>Business Email</FormLabel><FormControl><Input type="email" placeholder="contact@yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={businessForm.control} name="businessPhone" render={({ field }) => (
                <FormItem><FormLabel>Business Phone</FormLabel><FormControl><Input placeholder="+1 234 567 8901" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={businessForm.control} name="businessAddress" render={({ field }) => (
                <FormItem><FormLabel>Business Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={businessForm.control} name="businessWebsite" render={({ field }) => (
                <FormItem><FormLabel>Business Website</FormLabel><FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={businessForm.formState.isSubmitting}>
                  {businessForm.formState.isSubmitting ? (<><Spinner className="mr-2 h-4 w-4" /> Saving...</>) : 'Save Business Info'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
          
      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemePreference)} className="space-y-2">
            <Label htmlFor="theme-light" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="light" id="theme-light" /><span>Light</span></Label>
            <Label htmlFor="theme-dark" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="dark" id="theme-dark" /><span>Dark</span></Label>
            <Label htmlFor="theme-system" className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="system" id="theme-system" /><span>System</span></Label>
          </RadioGroup>
          <p className="text-sm text-muted-foreground mt-2">Current active theme: {resolvedTheme}</p>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProfileSettingsPage;

    