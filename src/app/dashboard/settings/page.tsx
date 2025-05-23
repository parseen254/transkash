
"use client";

import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, updateEmail, sendEmailVerification } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { DatabaseZap, Trash2 } from 'lucide-react'; // Added icons

import { db, auth, storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-provider';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ThemePreference, UserProfile } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeedDataDialog } from '@/components/dashboard/seed-data-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSeedDialogOpen, setIsSeedDialogOpen] = useState(false);
  const [isResetDataAlertOpen, setIsResetDataAlertOpen] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);

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
          const currentPhotoURL = userData.photoURL || user.photoURL;
          if (currentPhotoURL) {
            setAvatarPreview(currentPhotoURL);
          }
        } else {
          personalForm.reset({
            firstName: user.displayName?.split(' ')[0] || '',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            personalPhone: '',
          });
           if (user.photoURL) {
            setAvatarPreview(user.photoURL);
          }
        }
        setIsFetchingData(false);
      };
      fetchUserData();
    } else if (!authLoading && initialLoadComplete && !user) {
        router.push('/login');
        setIsFetchingData(false);
    } else if (!authLoading && !initialLoadComplete && !user) {
      // This condition might indicate the component is rendering before initialLoadComplete is true
      // and user is still null, but auth isn't "loading" in the sense of an active Firebase check.
      // Setting isFetchingData to false here ensures spinners stop if this state is reached.
      setIsFetchingData(false);
    }
  }, [user, authLoading, initialLoadComplete, personalForm, businessForm, router]);


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
    setIsUploadingAvatar(true); // Using this for general personal info save state too

    try {
      let finalPhotoURL = avatarPreview || user.photoURL; // Start with current or existing auth photoURL
      
      if (avatarFile) {
        const imageRef = storageRef(storage, `user-avatars/${user.uid}/${avatarFile.name}`);
        await uploadBytes(imageRef, avatarFile);
        finalPhotoURL = await getDownloadURL(imageRef);
        setAvatarPreview(finalPhotoURL); 
        setAvatarFile(null); 
      }

      const userDocRef = doc(db, "users", user.uid);
      const profileDataToSave: Partial<UserProfile> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        personalPhone: data.personalPhone || '',
        photoURL: finalPhotoURL,
        displayName: `${data.firstName} ${data.lastName}`,
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, profileDataToSave, { merge: true });

      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        const authProfileUpdates: { displayName?: string; photoURL?: string | null } = {};
        if (currentAuthUser.displayName !== profileDataToSave.displayName) {
            authProfileUpdates.displayName = profileDataToSave.displayName;
        }
        if (finalPhotoURL && currentAuthUser.photoURL !== finalPhotoURL) {
            authProfileUpdates.photoURL = finalPhotoURL;
        }
        if (Object.keys(authProfileUpdates).length > 0) {
            await updateProfile(currentAuthUser, authProfileUpdates);
        }
        
        if (currentAuthUser.email !== data.email) {
          try {
            await updateEmail(currentAuthUser, data.email);
            await sendEmailVerification(currentAuthUser);
            toast({
              title: "Login Email Updated",
              description: "Your login email has been updated. A new verification link has been sent. You may need to log in again with your new email.",
              duration: 7000,
            });
          } catch (emailError: any) {
             console.error("Error updating email in Auth:", emailError);
             toast({
                title: "Login Email Update Failed",
                description: `Could not update login email. ${emailError.message}. Other details saved.`,
                variant: "destructive", duration: 9000,
              });
              // Revert email field in form if auth update failed
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
      setIsUploadingAvatar(false);
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

  const handleResetData = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to reset data.", variant: "destructive" });
      setIsResetDataAlertOpen(false);
      return;
    }
    setIsResettingData(true);
    try {
      const batch = writeBatch(db);
      const collectionsToClear = ['paymentLinks', 'transactions', 'payoutAccounts'];
      let totalCleared = 0;

      for (const collectionName of collectionsToClear) {
        const q = query(collection(db, collectionName), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(docSnap => batch.delete(docSnap.ref));
        totalCleared += snapshot.size;
      }

      if (totalCleared > 0) {
        await batch.commit();
        toast({ title: "Data Reset Successful", description: `Successfully deleted ${totalCleared} items associated with your account.` });
      } else {
        toast({ title: "No Data Found", description: "No data found to reset for your account." });
      }
    } catch (error: any) {
      console.error("Error resetting user data:", error);
      toast({ title: "Data Reset Failed", description: `An error occurred: ${error.message}`, variant: "destructive" });
    } finally {
      setIsResettingData(false);
      setIsResetDataAlertOpen(false);
    }
  };
  
  const isLoading = authLoading || isFetchingData;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-9 w-1/3 mb-1" /><Skeleton className="h-5 w-1/2" /></div>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <Card><CardHeader><Skeleton className="h-7 w-1/4 mb-1" /><Skeleton className="h-4 w-2/5" /></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6"><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="h-10 w-32" /></div>
                {[...Array(3)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}
                <div className="flex justify-end"><Skeleton className="h-10 w-32" /></div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Add similar skeleton structures for Business, Appearance, and Data tabs if desired */}
        </Tabs>
      </div>
    );
  }

  if (!user && !authLoading && !isFetchingData) {
     return (<div className="space-y-6"><p>Please log in to view your settings.</p><Button onClick={() => router.push('/login')}>Go to Login</Button></div>);
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (user?.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return user.displayName[0]?.toUpperCase() || 'U';
    }
    return 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your personal, business, and appearance settings.</p>
      </div>
      
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Form {...personalForm}>
            <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and avatar here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 text-3xl">
                        <AvatarImage src={avatarPreview || undefined} alt={personalForm.getValues('firstName') || user?.displayName || 'User'} data-ai-hint="user avatar" />
                        <AvatarFallback>{getInitials(personalForm.getValues('firstName'), personalForm.getValues('lastName'))}</AvatarFallback>
                      </Avatar>
                      {isUploadingAvatar && <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"><Spinner className="text-white" /></div>}
                    </div>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingAvatar}>
                      Change Avatar
                    </Button>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/png, image/jpeg, image/gif"
                      className="hidden"
                      disabled={isUploadingAvatar}
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
                  
                </CardContent>
                 <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={personalForm.formState.isSubmitting || isUploadingAvatar}>
                      {personalForm.formState.isSubmitting || isUploadingAvatar ? (<><Spinner className="mr-2 h-4 w-4" /> Saving...</>) : 'Save Personal Info'}
                    </Button>
                  </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="business">
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
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={businessForm.formState.isSubmitting}>
                      {businessForm.formState.isSubmitting ? (<><Spinner className="mr-2 h-4 w-4" /> Saving...</>) : 'Save Business Info'}
                    </Button>
                  </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>
            
        <TabsContent value="appearance">
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
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your application data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Seed Dummy Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Populate your account with sample data for testing and demonstration purposes. 
                  This will clear existing payment links, transactions, and payout accounts for your user.
                </p>
                <Button onClick={() => setIsSeedDialogOpen(true)} variant="outline">
                  <DatabaseZap className="mr-2 h-4 w-4" /> Seed Dummy Data
                </Button>
              </div>
              <hr/>
              <div>
                <h3 className="text-lg font-medium text-destructive mb-2">Reset Account Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  This action will permanently delete all your payment links, transactions, and payout accounts. 
                  Your user profile and settings will remain. This action cannot be undone.
                </p>
                <AlertDialog open={isResetDataAlertOpen} onOpenChange={setIsResetDataAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Reset All My Data</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your payment links, transactions, and payout accounts. 
                        This action cannot be undone. Your user profile and settings will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isResettingData}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetData} disabled={isResettingData} className={buttonVariants({variant: "destructive"})}>
                        {isResettingData ? <><Spinner className="mr-2" /> Resetting...</> : "Yes, Reset My Data"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <SeedDataDialog open={isSeedDialogOpen} onOpenChange={setIsSeedDialogOpen} />
    </div>
  );
};

export default ProfileSettingsPage;
    

    
