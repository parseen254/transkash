import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard/home'); // Updated redirect
  return null; 
}
