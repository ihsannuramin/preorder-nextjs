"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MultiImageUpload } from "@/components/shared/multi-image-upload";
import { updateProduct } from "@/actions/products";

interface ProductImageUploadProps {
  productId: string;
  initialImages?: string[];
  initialUrl?: string | null;
}

export function ProductImageUpload({
  productId,
  initialImages,
  initialUrl,
}: ProductImageUploadProps) {
  const [images, setImages] = useState<string[]>(
    initialImages && initialImages.length > 0
      ? initialImages
      : initialUrl
        ? [initialUrl]
        : [],
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(newImages: string[]) {
    const prev = images;
    setImages(newImages);

    startTransition(async () => {
      const result = await updateProduct(productId, { images: newImages });
      if (!result.success) {
        toast.error("Gagal menyimpan foto");
        setImages(prev);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <MultiImageUpload value={images} onChange={handleChange} disabled={isPending} />
      {isPending && (
        <p className="text-[11px] text-center text-muted-foreground font-medium">Menyimpan...</p>
      )}
    </div>
  );
}
