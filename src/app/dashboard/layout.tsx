import type React from 'react';
import { MainSidebar } from '@/components/dashboard/main-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      <main className="flex-1 p-6 md:p-8 ml-64"> {/* Add ml-64 to offset sidebar width */}
        {children}
      </main>
    </div>
  );
}
