import { formatIDR } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";

type CurrencyDisplayProps = {
  amount: number | string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

// Brand §12.3: angka uang selalu semibold, tabular supaya kolom rapi.
const sizeClasses = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
};

export function CurrencyDisplay({ amount, className, size = "md" }: CurrencyDisplayProps) {
  return (
    <span className={cn("tabular-nums", sizeClasses[size], className)}>{formatIDR(amount)}</span>
  );
}
