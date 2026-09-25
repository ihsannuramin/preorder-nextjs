"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "pohub:hints";

type Props = {
  id: string;
  message: string;
  show?: boolean;
  side?: "top" | "bottom";
  children: React.ReactNode;
};

export function OnboardingHint({ id, message, show = true, side = "bottom", children }: Props) {
  // Start as dismissed to prevent SSR flash
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      setDismissed(stored.includes(id));
    } catch {
      setDismissed(false);
    }
  }, [id]);

  function dismiss() {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (!stored.includes(id)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, id]));
      }
    } catch {}
    setDismissed(true);
  }

  if (!show || dismissed) return <>{children}</>;

  return (
    <div className="relative inline-block">
      {children}

      <div
        className={`absolute z-50 w-64 left-1/2 -translate-x-1/2 ${
          side === "top" ? "bottom-full mb-3" : "top-full mt-3"
        }`}
      >
        {/* Arrow top (when bubble is below element) */}
        {side === "bottom" && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-50 border-l border-t border-primary-200 rotate-45" />
        )}

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <p className="text-xs font-medium text-foreground flex-1 leading-relaxed">{message}</p>
            <button
              onClick={dismiss}
              className="flex-shrink-0 mt-0.5 rounded hover:bg-black/10 p-0.5 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-3.5 w-3.5 text-foreground" />
            </button>
          </div>
          <button
            onClick={dismiss}
            className="mt-2 text-xs font-bold text-foreground hover:underline"
          >
            Mengerti ✓
          </button>
        </div>

        {/* Arrow bottom (when bubble is above element) */}
        {side === "top" && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-50 border-r border-b border-primary-200 rotate-45" />
        )}
      </div>
    </div>
  );
}
