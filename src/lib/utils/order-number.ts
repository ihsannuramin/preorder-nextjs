import { Prisma } from "@prisma/client";

export function formatOrderNumber(year: number, sequence: number): string {
  return `PO-${year}-${String(sequence).padStart(4, "0")}`;
}

export function isOrderNumberConflict(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    ((err.meta?.target as string[] | undefined)?.includes("orderNumber") ?? false)
  );
}
