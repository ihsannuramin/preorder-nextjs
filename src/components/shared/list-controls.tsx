"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export function ListSearch({
  defaultValue = "",
  placeholder = "Cari...",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);
  const skipNext = useRef(false);

  // Sync input when URL changes externally (e.g. browser back/forward)
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    setValue(defaultValue);
  }, [defaultValue]);

  // Debounce user typing → update URL
  useEffect(() => {
    const timer = setTimeout(() => {
      skipNext.current = true;
      const params = new URLSearchParams();
      if (value) params.set("q", value);
      router.replace(`${pathname}${value ? `?${params}` : ""}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, pathname, router]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        className="pl-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

export function ListPagination({
  total,
  page,
  pageSize,
  search,
  extraParams,
}: {
  total: number;
  page: number;
  pageSize: number;
  search?: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const navigate = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value) params.set(key, value);
      }
    }
    params.set("page", String(newPage));
    router.replace(`${pathname}?${params}`);
  };

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-muted-foreground">
        {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page <= 1}
          onClick={() => navigate(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-2">
          {page}/{totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page >= totalPages}
          onClick={() => navigate(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
