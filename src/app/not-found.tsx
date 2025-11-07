import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="default">
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
