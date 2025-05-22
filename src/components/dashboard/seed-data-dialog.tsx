
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { seedFirestoreData } from "@/lib/seed"; // Assuming seedFirestoreData is exported
import { Spinner } from "../ui/spinner"; // Assuming you have a Spinner component

interface SeedDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeedDataDialog({ open, onOpenChange }: SeedDataDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [numPaymentLinks, setNumPaymentLinks] = useState(5);
  const [numMpesaAccounts, setNumMpesaAccounts] = useState(1);
  const [numBankAccounts, setNumBankAccounts] = useState(1);
  const [numTransactionsPerLink, setNumTransactionsPerLink] = useState(3);

  const [isSeeding, setIsSeeding] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const handleSeedData = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to seed data.", variant: "destructive" });
      return;
    }

    setIsSeeding(true);
    setProgressMessage("Preparing to seed data...");

    try {
      const counts = {
        paymentLinks: numPaymentLinks,
        mpesaPayoutAccounts: numMpesaAccounts,
        bankPayoutAccounts: numBankAccounts,
        transactionsPerLink: numTransactionsPerLink,
      };

      setProgressMessage("Clearing existing data...");
      // clearExistingData is now called within seedFirestoreData
      // await clearExistingData(user.uid); 

      setProgressMessage("Seeding new data... This may take a moment.");
      await seedFirestoreData(user.uid, counts); // No callback passed

      toast({ title: "Success", description: "Dummy data seeded successfully!" });
      setProgressMessage("Seeding complete!");
      
      setTimeout(() => {
         onOpenChange(false); // Close dialog after success
      }, 2000);

    } catch (error: any) {
      console.error("Error seeding data:", error);
      toast({ title: "Error", description: `Failed to seed data: ${error.message}`, variant: "destructive" });
      setProgressMessage(`Error: ${error.message}`);
    } finally {
      // Only set isSeeding to false if not auto-closing on success
      // If auto-closing, the component might unmount before this runs.
      // For simplicity, we let the success timeout handle closing.
      // If there's an error, user can retry or cancel.
      if (!progressMessage.includes("Seeding complete!")) { // Keep dialog open on error for retry
           setIsSeeding(false);
      }
    }
  };
  
  const handleClose = () => {
    if (!isSeeding) {
      onOpenChange(false);
      setProgressMessage(""); // Reset message on close
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Seed Dummy Data</DialogTitle>
          <DialogDescription>
            Configure and generate dummy data for your account. This will create new entries in Firestore.
          </DialogDescription>
        </DialogHeader>
        
        {!isSeeding && !progressMessage.includes("Seeding complete!") ? (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="numPaymentLinks" className="text-right col-span-1">Payment Links</Label>
              <Input id="numPaymentLinks" type="number" value={numPaymentLinks} onChange={(e) => setNumPaymentLinks(Math.max(0, parseInt(e.target.value)))} className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="numTransactionsPerLink" className="text-right col-span-1">Transactions per Link</Label>
              <Input id="numTransactionsPerLink" type="number" value={numTransactionsPerLink} onChange={(e) => setNumTransactionsPerLink(Math.max(0, parseInt(e.target.value)))} className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="numMpesaAccounts" className="text-right col-span-1">M-Pesa Accounts</Label>
              <Input id="numMpesaAccounts" type="number" value={numMpesaAccounts} onChange={(e) => setNumMpesaAccounts(Math.max(0, parseInt(e.target.value)))} className="col-span-2 h-8" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="numBankAccounts" className="text-right col-span-1">Bank Accounts</Label>
              <Input id="numBankAccounts" type="number" value={numBankAccounts} onChange={(e) => setNumBankAccounts(Math.max(0, parseInt(e.target.value)))} className="col-span-2 h-8" />
            </div>
            <div className="mt-4 p-4 bg-secondary rounded-md">
              <h4 className="font-semibold mb-2 text-sm">Summary:</h4>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                <li>Create {numPaymentLinks} Payment Link(s).</li>
                <li>For each Payment Link, create {numTransactionsPerLink} Transaction(s).</li>
                <li>Create {numMpesaAccounts} M-Pesa Payout Account(s).</li>
                <li>Create {numBankAccounts} Bank Payout Account(s).</li>
              </ul>
              <p className="text-xs text-destructive mt-2">Note: This action will first clear existing data for these categories for user ID: {user?.uid.slice(0,10)}...</p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Spinner className="h-8 w-8 mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground mb-2">{progressMessage}</p>
             {/* Progress bar removed as granular updates are gone */}
             {progressMessage.includes("Seeding complete!") && <p className="text-green-600 text-sm mt-2">Redirecting shortly...</p>}
             {progressMessage.toLowerCase().includes("error") && <p className="text-destructive text-sm mt-2">{progressMessage}</p>}
          </div>
        )}

        <DialogFooter>
          {!isSeeding && !progressMessage.includes("Seeding complete!") && <Button variant="outline" onClick={handleClose}>Cancel</Button>}
          <Button onClick={handleSeedData} disabled={isSeeding || !user || progressMessage.includes("Seeding complete!")}>
            {isSeeding ? <><Spinner className="mr-2"/> Seeding...</> : "Start Seeding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
