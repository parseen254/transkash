
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { signInWithEmailAndPassword, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth, googleAuthProvider, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CenteredCardLayout } from '@/components/layouts/centered-card-layout';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ChromeIcon } from 'lucide-react'; // Assuming you have a Chrome or Google icon

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user && !user.emailVerified) {
        await auth.signOut(); // Sign out user if email is not verified
        await sendEmailVerification(user);
        toast({
          title: "Email Not Verified",
          description: "Your email address is not verified. We've sent a new verification link to your email. Please check your inbox (and spam folder).",
          variant: "destructive",
          duration: 9000,
        });
        form.reset(); // Reset form
        return;
      }
      
      // Update last login time
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
        ? "Invalid email or password. Please try again."
        : "An error occurred during login. Please try again.";
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      
      // Check if it's a new user via Google Sign-In
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // New user, create a document in Firestore
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          provider: 'google.com',
        });
      } else {
         // Existing user, update last login
        await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  

  return (
    <CenteredCardLayout title="Login to Your Account">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
      <div className="my-4 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-border after:mt-0.5 after:flex-1 after:border-t after:border-border">
        <p className="mx-4 mb-0 text-center font-semibold text-muted-foreground">OR</p>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={form.formState.isSubmitting}>
        <ChromeIcon className="mr-2 h-4 w-4" /> Continue with Google
      </Button>
      <div className="mt-6 text-center text-sm">
        <Link href="/forgot-password" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Forgot Password?</a>
        </Link>
      </div>
      <div className="mt-4 text-center text-sm">
        New to pesi X?{' '}
        <Link href="/signup" legacyBehavior>
          <a className="font-medium text-primary hover:underline">Create an account</a>
        </Link>
      </div>
    </CenteredCardLayout>
  );
};

export default LoginPage;
