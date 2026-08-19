import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/cn";

const dotVariants = cva("h-2.5 w-2.5 rounded-full", {
  variants: {
    tone: {
      online: "bg-emerald-500",
      offline: "bg-rose-500",
      pending: "bg-amber-400 animate-pulse",
    },
  },
  defaultVariants: { tone: "pending" },
});

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof dotVariants> {
  label: string;
  value: string;
}

/**
 * A single labelled status row with a colored state dot.
 * Used on the landing page for backend and database connectivity.
 */
export function StatusIndicator({ label, value, tone, className, ...props }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-background/60 px-4 py-3",
        className,
      )}
      {...props}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className={cn(dotVariants({ tone }))} aria-hidden="true" />
        {value}
      </span>
    </div>
  );
}
