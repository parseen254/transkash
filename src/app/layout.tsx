import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist_Sans to Inter
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { APP_NAME, APP_DESCRIPTION } from '@/lib/constants';

const inter = Inter({ // Changed from geistSans to inter
  subsets: ['latin'],
  variable: '--font-inter', // Using a standard variable name for Inter
});

// Geist Mono is not explicitly used in this design, can be removed if not needed elsewhere
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use inter.variable */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
