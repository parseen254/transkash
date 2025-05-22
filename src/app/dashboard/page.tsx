import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard/payment-links');
  return null; 
}
