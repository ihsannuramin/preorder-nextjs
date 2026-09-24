import { prisma } from "@/lib/prisma";
import { calculateMargin, calculateProfit } from "@/lib/utils/hpp";

const PAID_STATUSES = ["PAID", "PRODUCTION", "READY", "COMPLETED"] as const;

export type StoreFinanceSummary = {
  revenue: number;
  totalHpp: number;
  profit: number;
  margin: number;
  paidOrderCount: number;
};

export async function getStoreFinanceSummary(storeId: string): Promise<StoreFinanceSummary> {
  const result = await prisma.order.aggregate({
    where: {
      campaign: { storeId },
      status: { in: [...PAID_STATUSES] },
    },
    _sum: { totalAmount: true, totalHpp: true },
    _count: true,
  });

  const revenue = Number(result._sum.totalAmount ?? 0);
  const totalHpp = Number(result._sum.totalHpp ?? 0);

  return {
    revenue,
    totalHpp,
    profit: calculateProfit(revenue, totalHpp),
    margin: calculateMargin(revenue, totalHpp),
    paidOrderCount: result._count,
  };
}
