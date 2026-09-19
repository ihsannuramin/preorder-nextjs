import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generateProductionNeeds } from "@/lib/utils/production";
import { createLogger } from "@/lib/logger";

const logger = createLogger("route:export/csv");

async function getStore() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { store: true },
  });
  if (!dbUser?.store) throw new Error("Store not found");
  return dbUser.store;
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const store = await getStore();
    const type = request.nextUrl.searchParams.get("type") ?? "orders";

    let csv = "";
    let filename = "laporan";

    if (type === "orders") {
      const orders = await prisma.order.findMany({
        where: { campaign: { storeId: store.id } },
        include: { campaign: true, items: true },
        orderBy: { createdAt: "desc" },
      });

      const rows = orders.map((o) => ({
        "Nomor Pesanan": o.orderNumber,
        "Nama Pelanggan": o.customerName,
        "No HP": o.customerPhone,
        "Alamat": o.customerAddress,
        "Total": String(o.totalAmount),
        "HPP": String(o.totalHpp),
        "Status": o.status,
        "Kampanye": o.campaign.name,
        "Tanggal": o.createdAt.toISOString(),
      }));
      csv = toCSV(rows);
      filename = "laporan-pesanan";
    } else if (type === "profit") {
      const campaigns = await prisma.campaign.findMany({
        where: { storeId: store.id },
        include: {
          orders: {
            where: { status: { in: ["PAID", "PRODUCTION", "READY", "COMPLETED"] } },
          },
        },
      });

      const rows = campaigns.map((c) => {
        const revenue = c.orders.reduce((s, o) => s + Number(o.totalAmount), 0);
        const hpp = c.orders.reduce((s, o) => s + Number(o.totalHpp), 0);
        return {
          "Kampanye": c.name,
          "Status": c.status,
          "Jumlah Pesanan": c.orders.length,
          "Total Pendapatan": revenue,
          "Total HPP": hpp,
          "Keuntungan": revenue - hpp,
          "Margin (%)": revenue > 0 ? (((revenue - hpp) / revenue) * 100).toFixed(2) : "0",
        };
      });
      csv = toCSV(rows);
      filename = "laporan-keuntungan";
    } else if (type === "production") {
      const orderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            status: { in: ["PAID", "PRODUCTION", "READY", "COMPLETED"] },
            campaign: { storeId: store.id },
          },
        },
        include: {
          product: {
            include: {
              recipeItems: { include: { ingredient: true } },
            },
          },
        },
      });

      const needs = generateProductionNeeds(
        orderItems.map((item) => ({
          quantity: item.quantity,
          product: item.product
            ? {
                recipeItems: item.product.recipeItems.map((ri) => ({
                  quantity: Number(ri.quantity),
                  ingredient: {
                    id: ri.ingredient.id,
                    name: ri.ingredient.name,
                    unit: ri.ingredient.unit,
                    averageCost: Number(ri.ingredient.averageCost),
                  },
                })),
              }
            : null,
        }))
      );

      const rows = needs.map((n) => ({
        "Bahan Baku": n.ingredientName,
        "Satuan": n.unit,
        "Total Kebutuhan": n.totalQuantity,
        "Estimasi Biaya": n.estimatedCost,
      }));
      csv = toCSV(rows);
      filename = "laporan-produksi";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (err) {
    logger.error("CSV export failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
