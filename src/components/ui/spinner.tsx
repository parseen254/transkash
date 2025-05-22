
"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)} // Default size, can be overridden by className
      {...props}
    />
  );
}
