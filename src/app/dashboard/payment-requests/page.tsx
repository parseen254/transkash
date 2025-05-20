
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getPaymentRequestsByUser } from '@/lib/actions';
import type { PaymentRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Link2, Loader2, Copy, Check, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<PaymentRequest['status'], string> = {
  PENDING: 'bg-yellow-500 hover:bg-yellow-500',
  PAID: 'bg-green-500 hover:bg-green-500',
  EXPIRED: 'bg-gray-500 hover:bg-gray-500',
  CANCELED: 'bg-red-500 hover:bg-red-500',
};


export default function PaymentRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const { toast } = useToast();
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      if (!user || authLoading) return;
      setLoadingRequests(true);
      try {
        const fetchedRequests = await getPaymentRequestsByUser(user.uid);
        setRequests(fetchedRequests);
      } catch (error) {
        console.error("Failed to fetch payment requests:", error);
        toast({ title: "Error", description: "Could not load payment requests.", variant: "destructive" });
      } finally {
        setLoadingRequests(false);
      }
    }
    fetchRequests();
  }, [user, authLoading, toast]);

  const getPaymentLink = (requestId: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pay/${requestId}`;
    }
    return ''; // Fallback for SSR or if window is not available
  };

  const handleCopyToClipboard = (link: string, requestId: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLinkId(requestId);
      toast({ title: "Link Copied!"});
      setTimeout(() => setCopiedLinkId(null), 2000);
    }).catch(err => {
      toast({ title: "Failed to copy", description: "Could not copy link to clipboard.", variant: "destructive"});
    });
  };

  if (authLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Link2 className="mr-3 h-8 w-8 text-primary" />
          Payment Requests
        </h1>
        <Link href="/dashboard/payment-requests/new">
          <Button className="shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Request
          </Button>
        </Link>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Payment Requests</CardTitle>
          <CardDescription>Manage and track the payment requests you&apos;ve created.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">Date Created</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const paymentLink = getPaymentLink(req.id);
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="hidden md:table-cell">
                        {format(new Date(req.createdAt), 'PPp')}
                      </TableCell>
                      <TableCell>{req.amount.toFixed(2)} {req.currency}</TableCell>
                      <TableCell className="max-w-xs truncate">{req.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[req.status]} text-primary-foreground px-2 py-1 text-xs`}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild title="View Public Link">
                          <Link href={paymentLink} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => paymentLink && handleCopyToClipboard(paymentLink, req.id)}
                          disabled={!paymentLink}
                          title="Copy Link"
                        >
                          {copiedLinkId === req.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        {/* Add more actions like 'Cancel' later */}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-xl">No payment requests found.</p>
              <p className="mt-2">Click the button above to create your first one!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
