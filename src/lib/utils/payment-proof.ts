export const PAYMENT_PROOF_BUCKET =
  process.env.NEXT_PUBLIC_STORAGE_BUCKET_PAYMENTS ?? "payment-proofs";

export function extractPaymentProofPath(value: string): string {
  if (!value.startsWith("http")) return value;
  const marker = `/object/public/${PAYMENT_PROOF_BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx === -1) return value;
  return decodeURIComponent(value.slice(idx + marker.length));
}
