import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-sm hover:bg-primary-700 active:bg-primary-800",
        secondary:
          "bg-white text-foreground border border-border shadow-sm hover:bg-muted hover:border-border-strong",
        outline:
          "bg-white text-foreground border border-border hover:bg-muted hover:border-primary-300",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "bg-transparent text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto",
        destructive:
          "bg-error text-white shadow-sm hover:bg-error-700",
      },
      size: {
        default: "h-12 px-5 py-2 rounded-button text-sm",
        sm: "h-9 px-4 rounded-button text-xs",
        lg: "h-14 px-8 rounded-button text-base",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
