import { prisma } from "@/lib/prisma";
import { calculateMargin, calculateProfit } from "@/lib/utils/hpp";
import { startOfDay, subDays, addDays, differenceInCalendarDays, format } from "date-fns";

const PAID_STATUSES = ["PAID", "PRODUCTION", "READY", "COMPLETED"] as const;
const STALE_PAYMENT_REVIEW_DAYS = 2;

export type PlatformOverviewCounts = {
  totalStores: number;
  activeStores: number;
  suspendedStores: number;
  totalUsers: number;
  totalOrders: number;
  ordersToday: number;
  ordersThisMonth: number;
};

export async function getPlatformOverviewCounts(): Promise<PlatformOverviewCounts> {
  const todayStart = startOfDay(new Date());
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const [totalStores, activeStores, totalUsers, totalOrders, ordersToday, ordersThisMonth] =
    await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

  return {
    totalStores,
    activeStores,
    suspendedStores: totalStores - activeStores,
    totalUsers,
    totalOrders,
    ordersToday,
    ordersThisMonth,
  };
}

export type PlatformFinanceSummary = {
  revenue: number;
  totalHpp: number;
  profit: number;
  margin: number;
  paidOrderCount: number;
};

export async function getPlatformFinanceSummary(): Promise<PlatformFinanceSummary> {
  const result = await prisma.order.aggregate({
    where: { status: { in: [...PAID_STATUSES] } },
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

export type DailyCount = { date: string; count: number };

export function bucketByDay(dates: Date[], days: number, today: Date = new Date()): DailyCount[] {
  const start = startOfDay(subDays(today, days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    buckets.set(format(addDays(start, i), "yyyy-MM-dd"), 0);
  }

  for (const date of dates) {
    const key = format(startOfDay(date), "yyyy-MM-dd");
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export async function getSignupGrowth(days = 14): Promise<DailyCount[]> {
  const since = startOfDay(subDays(new Date(), days - 1));
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  return bucketByDay(users.map((u) => u.createdAt), days);
}

export async function getOrderGrowth(days = 14): Promise<DailyCount[]> {
  const since = startOfDay(subDays(new Date(), days - 1));
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  return bucketByDay(orders.map((o) => o.createdAt), days);
}

export type NeedsAttention = {
  stalePaymentReviews: {
    id: string;
    orderNumber: string;
    customerName: string;
    storeName: string;
    daysWaiting: number;
  }[];
  overdueOpenCampaigns: {
    id: string;
    name: string;
    storeName: string;
    closedDaysAgo: number;
  }[];
};

export async function getNeedsAttention(): Promise<NeedsAttention> {
  const now = new Date();
  const staleThreshold = subDays(now, STALE_PAYMENT_REVIEW_DAYS);

  const [staleOrders, overdueCampaigns] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PAYMENT_REVIEW", updatedAt: { lte: staleThreshold } },
      include: { campaign: { include: { store: { select: { name: true } } } } },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
    prisma.campaign.findMany({
      where: { status: "OPEN", closeDate: { lt: now } },
      include: { store: { select: { name: true } } },
      orderBy: { closeDate: "asc" },
      take: 20,
    }),
  ]);

  return {
    stalePaymentReviews: staleOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      storeName: o.campaign.store.name,
      daysWaiting: differenceInCalendarDays(now, o.updatedAt),
    })),
    overdueOpenCampaigns: overdueCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      storeName: c.store.name,
      closedDaysAgo: differenceInCalendarDays(now, c.closeDate),
    })),
  };
}
