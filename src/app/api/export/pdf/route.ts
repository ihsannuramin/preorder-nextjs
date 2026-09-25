import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const logger = createLogger("route:export/pdf");

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

export async function GET(request: NextRequest) {
  try {
    const store = await getStore();
    const type = request.nextUrl.searchParams.get("type") ?? "orders";

    const orders = await prisma.order.findMany({
      where: { campaign: { storeId: store.id } },
      include: { campaign: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`Laporan Pesanan — ${store.name}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["No. Pesanan", "Pelanggan", "Total", "Status", "Periode PO"]],
      body: orders.map((o) => [
        o.orderNumber,
        o.customerName,
        `Rp ${Number(o.totalAmount).toLocaleString("id-ID")}`,
        o.status,
        o.campaign.name,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [139, 92, 246] },
    });

    const buffer = Buffer.from(doc.output("arraybuffer"));
    const filename = type === "profit" ? "laporan-keuntungan.pdf" : "laporan-pesanan.pdf";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    logger.error("PDF export failed", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
