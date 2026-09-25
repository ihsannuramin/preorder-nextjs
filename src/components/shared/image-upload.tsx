"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  disabled?: boolean;
  className?: string;
}

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  disabled,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WebP)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Foto berhasil diupload!");
    } catch {
      toast.error("Gagal mengupload foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const isDisabled = disabled || uploading;

  return (
    <div className={cn("w-full", className)}>
      {value ? (
        <div className="relative group w-full aspect-square rounded-lg border border-border shadow-sm overflow-hidden bg-muted">
          <Image
            src={value}
            alt="Foto produk"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isDisabled}
              className="bg-white border border-border text-foreground rounded-full px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={isDisabled}
              className="bg-error border border-error text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-error-700 transition-colors disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "w-full aspect-square flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed transition-all duration-150 cursor-pointer select-none",
            dragging
              ? "border-solid border-primary bg-primary-50 scale-[1.02]"
              : "border-border-strong bg-muted hover:bg-primary-50 hover:border-primary hover:border-solid",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-foreground animate-spin" />
              </div>
              <p className="text-xs font-bold text-foreground">Mengupload...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-border flex items-center justify-center shadow-sm">
                <Upload className="h-5 w-5 text-foreground" />
              </div>
              <div className="text-center px-2">
                <p className="text-xs font-bold text-foreground">Upload Foto Produk</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">atau drag &amp; drop di sini</p>
                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP · maks 5MB</p>
              </div>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
