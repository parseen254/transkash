import type React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AppLogo } from '@/components/shared/app-logo';

interface CenteredCardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  cardClassName?: string;
}

export function CenteredCardLayout({
  children,
  title,
  showLogo = true,
  cardClassName,
}: CenteredCardLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {showLogo && (
          <div className="mb-8 flex justify-center">
            <AppLogo />
          </div>
        )}
        <Card className={cardClassName}>
          {title && (
            <CardHeader>
              <h2 className="text-2xl font-semibold text-center text-foreground">{title}</h2>
            </CardHeader>
          )}
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
