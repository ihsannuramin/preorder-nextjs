import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { OnboardingHint } from "./onboarding-hint";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
  hint?: string;
  hintId?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
  hint,
  hintId,
}: EmptyStateProps) {
  const ctaButton =
    ctaLabel && ctaHref ? (
      <Button asChild>
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    ) : ctaLabel && onCtaClick ? (
      <Button onClick={onCtaClick}>{ctaLabel}</Button>
    ) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-primary-50 text-primary-600 p-4">
          <Icon className="h-8 w-8 text-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {ctaButton && hint && hintId ? (
        <OnboardingHint id={hintId} message={hint} side="top">
          {ctaButton}
        </OnboardingHint>
      ) : (
        ctaButton
      )}
    </div>
  );
}
