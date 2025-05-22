export interface PayoutAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  bankSwiftCode?: string;
  status: 'Active' | 'Pending' | 'Disabled';
}

export interface PaymentLink {
  id: string;
  linkName: string;
  reference: string;
  amount: string;
  purpose: string;
  creationDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Disabled' | 'Paid';
  payoutAccount?: string; // ID of the payout account
}

export interface PaymentDetails {
  reference: string;
  name: string;
  amount: string;
  date: string;
  status?: 'Successful' | 'Failed' | 'Pending';
  paymentReason?: string;
}
