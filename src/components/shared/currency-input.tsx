"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
}

function formatThousands(digits: string): string {
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(digits, 10));
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    const displayValue = formatThousands(digits);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const rawDigits = e.target.value.replace(/\D/g, "");
      onChange(rawDigits ? parseInt(rawDigits, 10) : 0);
    }

    return (
      <div className="flex rounded-input overflow-hidden border border-border focus-within:ring-2 focus-within:ring-ring focus-within:border-primary">
        <span className="flex items-center bg-muted px-3 text-sm text-muted-foreground border-r border-border whitespace-nowrap">
          Rp
        </span>
        <input
          ref={ref}
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            "flex-1 h-12 px-3 text-sm bg-white outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
