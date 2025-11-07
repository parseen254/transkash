
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Search, ChevronLeft, ChevronRight, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { Beneficiary } from '@/lib/types';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const ITEMS_PER_PAGE = 10;

const BeneficiariesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    
    // Fetch beneficiaries from Firestore
    const beneficiariesRef = collection(db, 'beneficiaries');
    const q = query(
      beneficiariesRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const beneficiaries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Beneficiary[];
        setAllBeneficiaries(beneficiaries);
        setLoadingData(false);
      },
      (error) => {
        console.error("Error fetching beneficiaries:", error);
        toast({ title: "Error", description: "Could not fetch beneficiaries.", variant: "destructive" });
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, router, toast]);

  // Filter beneficiaries based on search term
  const filteredBeneficiaries = useMemo(() => {
    if (!searchTerm) return allBeneficiaries;
    
    const lowerSearch = searchTerm.toLowerCase();
    return allBeneficiaries.filter(b => 
      b.firstName?.toLowerCase().includes(lowerSearch) ||
      b.lastName?.toLowerCase().includes(lowerSearch) ||
      b.beneficiaryNickname?.toLowerCase().includes(lowerSearch) ||
      b.beneficiaryEmailAddress?.toLowerCase().includes(lowerSearch)
    );
  }, [allBeneficiaries, searchTerm]);

  // Client-side pagination
  const totalPages = Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE);
  const paginatedBeneficiaries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBeneficiaries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBeneficiaries, currentPage]);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  if (authLoading || !user) { 
     return (
        <div className="flex justify-center items-center h-full p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Beneficiaries</h1>
        <Link href="/dashboard/beneficiaries/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Beneficiary
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search beneficiaries..."
          className="w-full bg-secondary border-border rounded-lg h-12 pl-10 pr-4 text-base focus-visible:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Beneficiaries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Contact (Email)</TableHead>
                  <TableHead>Collection Mode</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingData ? (
                  [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : paginatedBeneficiaries.length > 0 ? (
                  paginatedBeneficiaries.map((beneficiary) => (
                    <TableRow key={beneficiary.id}>
                      <TableCell className="font-medium">{beneficiary.firstName} {beneficiary.lastName}</TableCell>
                      <TableCell>{beneficiary.beneficiaryNickname || 'N/A'}</TableCell>
                      <TableCell>{beneficiary.beneficiaryEmailAddress || 'N/A'}</TableCell>
                      <TableCell>{beneficiary.collectionMode}</TableCell>
                      <TableCell>{beneficiary.countryIso3}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? `No beneficiaries found matching "${searchTerm}".` : "No beneficiaries created yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage === 1}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" onClick={handleNextPage} disabled={currentPage === totalPages}>Next <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
        )}
      </Card>
    </div>
  );
};

export default BeneficiariesPage;
