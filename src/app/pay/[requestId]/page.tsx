
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { getPaymentRequestPublic } from '@/lib/actions';
import type { PaymentRequest } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldCheck, CreditCard, Smartphone, Landmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import AppLogo from '@/components/AppLogo'; // Assuming AppLogo component exists
import { APP_NAME } from '@/lib/constants';
import Image from 'next/image';


function PaymentRequestContent() {
  const params = useParams();
  const requestId = params.requestId as string;
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Placeholder for sender details form
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderMpesaPhone, setSenderMpesaPhone] = useState('');


  useEffect(() => {
    async function fetchRequest() {
      if (!requestId) {
        setError('Invalid payment request link.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fetchedRequest = await getPaymentRequestPublic(requestId);
        if (fetchedRequest) {
          if (fetchedRequest.status !== 'PENDING') {
            setError(`This payment request is already ${fetchedRequest.status.toLowerCase()}.`);
            setRequest(fetchedRequest); // Still set request to show details if not pending
          } else {
            setRequest(fetchedRequest);
          }
        } else {
          setError('Payment request not found. Please check the link.');
        }
      } catch (e) {
        setError('Failed to load payment request details.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [requestId]);

  const handleStripePayment = () => {
    // TODO: Implement Stripe Checkout or Elements integration
    toast({ title: "Stripe Payment", description: "Stripe integration coming soon!", variant: "default" });
  };

  const handleMpesaStkPush = () => {
    if (!senderMpesaPhone.match(/^\+254\d{9}$/)) {
      toast({ title: "Invalid Phone", description: "Please enter a valid Kenyan MPESA number (+254...)", variant: "destructive" });
      return;
    }
    // TODO: Implement backend call to Daraja API for STK Push
    toast({ title: "MPESA STK Push", description: `STK Push to ${senderMpesaPhone} coming soon!`, variant: "default" });
  };


  if (loading) {
    return <PaymentPageSkeleton message="Loading payment request..." />;
  }

  if (error && !request) { // If error and no request data to display (e.g., totally invalid link)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
             <AppLogo className="mx-auto mb-4 h-10 w-auto" />
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!request) { // Should be covered by error state, but as a fallback
     return <PaymentPageSkeleton message="Payment request not found." />;
  }

  const isRequestClosed = request.status !== 'PENDING';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="bg-card p-6 text-center border-b">
                 <AppLogo className="mx-auto mb-4 h-10 w-auto text-primary" />
                <CardTitle className="text-3xl font-bold">Payment Request</CardTitle>
                {request.userId && <CardDescription className="text-sm text-muted-foreground">From a user of {APP_NAME}</CardDescription> }
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {isRequestClosed && (
                    <div className={`p-4 rounded-md text-center ${request.status === 'PAID' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-700'}`}>
                        <ShieldCheck className={`mx-auto h-10 w-10 mb-2 ${request.status === 'PAID' ? 'text-green-500' : 'text-yellow-500'}`} />
                        <p className="font-semibold text-lg">This payment request is {request.status.toLowerCase()}.</p>
                        {request.status === 'PAID' && <p className="text-sm">Thank you for your payment.</p>}
                        {request.status !== 'PAID' && <p className="text-sm">No further action is required.</p>}
                    </div>
                )}

                <div className="space-y-2 text-center">
                    <p className="text-lg text-muted-foreground">Amount due:</p>
                    <p className="text-5xl font-extrabold text-primary">
                        {request.amount.toFixed(2)} <span className="text-2xl font-semibold">{request.currency}</span>
                    </p>
                    {request.description && (
                        <p className="text-sm text-muted-foreground pt-2">Note: {request.description}</p>
                    )}
                </div>

                <div className="border-t border-b py-4 my-4 space-y-1 text-sm">
                    <InfoRow label="Request ID:" value={request.id.substring(0,12)+"..."} />
                    <InfoRow label="Date Created:" value={format(new Date(request.createdAt), 'MMM d, yyyy')} />
                </div>
                
                {!isRequestClosed && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-3 text-center">Choose Payment Method</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button onClick={handleStripePayment} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 shadow-md">
                                    <CreditCard className="mr-2 h-5 w-5" /> Pay with Card (Stripe)
                                </Button>
                                <Button onClick={handleMpesaStkPush} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 shadow-md">
                                    <Image src="/mpesa-logo-white.svg" alt="Mpesa" width={20} height={20} className="mr-2 filter brightness-0 invert" data-ai-hint="mpesa logo"/>
                                     MPESA STK Push
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm font-medium text-center mb-2">Or Pay via MPESA Paybill:</p>
                            <p className="text-center text-sm">
                                Business Number: <span className="font-semibold text-primary">XXXXXX</span> (App Paybill)
                            </p>
                            <p className="text-center text-sm">
                                Account Number: <span className="font-semibold text-primary">{request.id.substring(0,8)}</span> (Use this Request ID)
                            </p>
                             <p className="text-xs text-center text-muted-foreground mt-2">(MPESA Paybill processing coming soon)</p>
                        </div>

                         <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground text-center">Enter your MPESA phone for STK Push:</p>
                            <Input 
                                type="tel" 
                                placeholder="+2547XXXXXXXX" 
                                value={senderMpesaPhone}
                                onChange={(e) => setSenderMpesaPhone(e.target.value)}
                                className="text-center"
                            />
                            {/* Optional sender name/email inputs here if needed */}
                        </div>
                    </div>
                )}

            </CardContent>
            <CardFooter className="bg-muted/30 p-4 text-center border-t">
                <p className="text-xs text-muted-foreground">
                    Powered by {APP_NAME}. If you have questions, contact the person who sent you this link.
                </p>
            </CardFooter>
        </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number; }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function PaymentPageSkeleton({ message = "Loading..."}: {message?: string}) {
  return (
     <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-lg mx-auto shadow-xl">
            <CardHeader className="text-center">
                <AppLogo className="mx-auto mb-4 h-10 w-auto text-primary" />
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="text-center">
                    <Skeleton className="h-12 w-1/2 mx-auto mb-2" />
                    <Skeleton className="h-6 w-1/4 mx-auto" />
                </div>
                <div className="border-t border-b py-4 my-4 space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
                 <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                    <p className="text-muted-foreground">{message}</p>
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
            <CardFooter className="bg-muted/30 p-4 text-center border-t">
                <Skeleton className="h-3 w-3/4 mx-auto" />
            </CardFooter>
        </Card>
    </div>
  )
}

export default function PublicPaymentRequestPage() {
  return (
    // Suspense for data fetching is generally good, but useParams is client-side.
    // The loading state is handled within PaymentRequestContent.
    // <Suspense fallback={<PaymentPageSkeleton />}>
      <PaymentRequestContent />
    // </Suspense>
  )
}

