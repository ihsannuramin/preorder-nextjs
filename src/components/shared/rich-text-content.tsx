import { cn } from "@/lib/utils/cn";
import { toDisplayHtml } from "@/lib/utils/rich-text";
import { RICH_TEXT_CLASSES } from "@/components/shared/rich-text-classes";

export function RichTextContent({
  html,
  className,
}: {
  html: string | null | undefined;
  className?: string;
}) {
  const safe = toDisplayHtml(html);
  if (!safe) return null;
  return (
    <div
      className={cn(RICH_TEXT_CLASSES, className)}
      // Disanitasi oleh toDisplayHtml (whitelist tag & skema link).
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
