"use client";

// Sonner-backed notifications shim to avoid refactoring all call sites.
// Existing code uses: const { toast } = useToast(); toast({ title, description, variant })
// We translate to Sonner's API and map variants to colors.

import { toast as sonnerToast } from 'sonner';

type LegacyToastArgs = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | string;
  duration?: number;
};

function normalizeMessage(args: LegacyToastArgs): string | React.ReactNode {
  if (args.title && args.description) {
    return (
      <div>
        <div className="font-semibold">{args.title}</div>
        <div className="text-sm opacity-90">{args.description}</div>
      </div>
    );
  }
  return args.title || args.description || '';
}

function mapVariant(args: LegacyToastArgs) {
  const msg = normalizeMessage(args);
  const common = { duration: args.duration } as any;
  if (args.variant === 'destructive') {
    return sonnerToast.error(msg as any, common);
  }
  return sonnerToast.success(msg as any, common);
}

export function useToast() {
  return {
    toast: (args: LegacyToastArgs) => mapVariant(args),
    dismiss: (id?: string) => (id ? sonnerToast.dismiss(id) : sonnerToast.dismiss()),
  };
}

export const toast = (args: LegacyToastArgs) => mapVariant(args);
