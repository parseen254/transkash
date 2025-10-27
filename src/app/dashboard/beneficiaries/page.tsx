
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
import { api } from '@/lib/api';

const ITEMS_PER_PAGE = 10;

const BeneficiariesPage: NextPage = () => {
  const { user, loading: authLoading, initialLoadComplete } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialLoadComplete) return;

    if (!user) {
      router.push('/login');
      return;
    }
    setLoadingData(true);
    
    const fetchBeneficiaries = async () => {
      try {
        // The API requires many parameters, some of which we don't have a UI for yet.
        // We will use some defaults for now. This should be improved.
        const response = await api.get('/beneficiaries', {
          params: {
            SearchingText: searchTerm || user.userId, // Using userId as a fallback search text
            UserId: user.userId,
            serviceCode: 'MONEYTRANSFER',
            collectionMode: 'BANKACCOUNT',
            legalEntityType: 'I',
            countryIso3: 'USA',
            currencyIso: 'USD',
            PageNo: currentPage,
            PageSize: ITEMS_PER_PAGE,
          }
        });

        if (response.data.data) {
          const fetchedBeneficiaries = response.data.data.map((item: any) => ({
            id: item.beneficiaryId, // mapping from beneficiaryId
            ...item
          }));
          setAllBeneficiaries(fetchedBeneficiaries);
        } else {
          setAllBeneficiaries([]);
        }
      } catch (error) {
        console.error("Error fetching beneficiaries:", error);
        toast({ title: "Error", description: "Could not fetch beneficiaries.", variant: "destructive" });
      } finally {
        setLoadingData(false);
      }
    }

    fetchBeneficiaries();

  }, [user, initialLoadComplete, router, toast, currentPage, searchTerm]);

  // Since API handles pagination and search, we just display what we get.
  const paginatedBeneficiaries = allBeneficiaries;
  const totalPages = 1; // The API response should ideally give us total pages.

  const handleNextPage = () => setCurrentPage((prev) => prev + 1);
  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  
  if (authLoading || (!user && !initialLoadComplete)) { 
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on new search
          }}
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
