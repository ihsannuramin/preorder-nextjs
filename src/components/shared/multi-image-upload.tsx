"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const BUCKET = "product-images";
const MAX_SIZE = 5 * 1024 * 1024;

export function MultiImageUpload({
  value,
  onChange,
  folder = "products",
  max = 5,
  disabled,
  className,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${max} foto`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error("File harus berupa gambar (JPG, PNG, WebP)");
          continue;
        }
        if (file.size > MAX_SIZE) {
          toast.error("Ukuran gambar maksimal 5MB");
          continue;
        }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
        toast.success("Foto berhasil diupload!");
      }
    } catch {
      toast.error("Gagal mengupload foto. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
    e.target.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const isDisabled = disabled || uploading;
  const canAddMore = value.length < max;

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, index) => (
          <div
            key={url + index}
            className="relative group aspect-square rounded-lg border border-border shadow-sm overflow-hidden bg-muted"
          >
            <Image
              src={url}
              alt={`Foto produk ${index + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
            {index === 0 && (
              <span className="absolute top-1 left-1 bg-primary border border-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                Sampul
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              disabled={isDisabled}
              aria-label="Hapus foto"
              className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-5 w-5 text-white" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border-strong bg-muted hover:bg-primary-50 hover:border-primary hover:border-solid transition-all duration-150",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 text-foreground animate-spin" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-foreground" />
                <span className="text-[10px] font-bold text-foreground">Tambah</span>
              </>
            )}
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        Foto pertama jadi foto sampul. Maks {max} foto, JPG/PNG/WebP, 5MB per foto.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
