import { PrismaClient, ProductCategory, Unit, CampaignStatus, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_EMAIL = process.env.SEED_EMAIL ?? "ihsannuramin007@gmail.com";

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`  ${msg}`);
}

function section(title: string) {
  console.log(`\n▸ ${title}`);
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const INGREDIENTS = [
  { name: "Kopi Arabika",     unit: Unit.GRAM,     purchaseQty: 200,  purchasePrice: 85_000 },
  { name: "Susu Full Cream",  unit: Unit.ML,       purchaseQty: 1000, purchasePrice: 18_000 },
  { name: "Gula Aren Cair",   unit: Unit.ML,       purchaseQty: 500,  purchasePrice: 25_000 },
  { name: "Es Batu",          unit: Unit.GRAM,     purchaseQty: 1000, purchasePrice:  3_000 },
  { name: "Cup 16oz + Tutup", unit: Unit.PCS,      purchaseQty: 50,   purchasePrice: 35_000 },
  { name: "Sedotan",          unit: Unit.PCS,      purchaseQty: 100,  purchasePrice:  8_000 },
  { name: "Coklat Bubuk",     unit: Unit.GRAM,     purchaseQty: 250,  purchasePrice: 45_000 },
  { name: "Gula Pasir",       unit: Unit.GRAM,     purchaseQty: 1000, purchasePrice: 15_000 },
  { name: "Teh Celup",        unit: Unit.PCS,      purchaseQty: 50,   purchasePrice: 12_000 },
] as const;

const PRODUCTS = [
  {
    name: "Kopi Susu Gula Aren",
    description: "Kopi arabika premium dengan susu full cream dan gula aren asli. Nikmat dinikmati dingin maupun panas.",
    category: ProductCategory.BEVERAGE,
    basePrice: 18_000,
    status: "PUBLISHED" as const,
    recipe: [
      { ingredient: "Kopi Arabika",    quantity: 20  },
      { ingredient: "Susu Full Cream", quantity: 200 },
      { ingredient: "Gula Aren Cair",  quantity: 30  },
      { ingredient: "Es Batu",         quantity: 150 },
      { ingredient: "Cup 16oz + Tutup",quantity: 1   },
      { ingredient: "Sedotan",         quantity: 1   },
    ],
  },
  {
    name: "Kopi Hitam",
    description: "Kopi arabika tubruk klasik, disajikan panas.",
    category: ProductCategory.BEVERAGE,
    basePrice: 12_000,
    status: "PUBLISHED" as const,
    recipe: [
      { ingredient: "Kopi Arabika",    quantity: 15 },
      { ingredient: "Gula Pasir",      quantity: 10 },
      { ingredient: "Cup 16oz + Tutup",quantity: 1  },
      { ingredient: "Sedotan",         quantity: 1  },
    ],
  },
  {
    name: "Coklat Susu",
    description: "Minuman coklat creamy dengan campuran susu full cream. Cocok untuk semua usia.",
    category: ProductCategory.BEVERAGE,
    basePrice: 20_000,
    status: "PUBLISHED" as const,
    recipe: [
      { ingredient: "Coklat Bubuk",    quantity: 30  },
      { ingredient: "Susu Full Cream", quantity: 250 },
      { ingredient: "Gula Pasir",      quantity: 15  },
      { ingredient: "Es Batu",         quantity: 150 },
      { ingredient: "Cup 16oz + Tutup",quantity: 1   },
      { ingredient: "Sedotan",         quantity: 1   },
    ],
  },
  {
    name: "Es Teh Manis",
    description: "Teh manis segar dengan es. Pilihan hemat untuk sehari-hari.",
    category: ProductCategory.BEVERAGE,
    basePrice: 7_000,
    status: "DRAFT" as const,
    recipe: [
      { ingredient: "Teh Celup",       quantity: 2   },
      { ingredient: "Gula Pasir",      quantity: 20  },
      { ingredient: "Es Batu",         quantity: 200 },
      { ingredient: "Cup 16oz + Tutup",quantity: 1   },
      { ingredient: "Sedotan",         quantity: 1   },
    ],
  },
] as const;

// Customers for orders
const CUSTOMERS = [
  { name: "Siti Rahmawati",   phone: "+6281234567890", address: "Jl. Melati No. 12, Depok" },
  { name: "Budi Santoso",     phone: "+6282345678901", address: "Jl. Anggrek Blok C5, Bekasi" },
  { name: "Dewi Anggraini",   phone: "+6283456789012", address: "Perumahan Griya Asri No. 7, Bogor" },
  { name: "Ahmad Fauzi",      phone: "+6284567890123", address: "Jl. Raya Ciawi Km 3, Bogor" },
  { name: "Rina Susanti",     phone: "+6285678901234", address: "Komp. Vila Indah Blok A2, Tangerang" },
  { name: "Doni Pratama",     phone: "+6286789012345", address: "Jl. Flamboyan No. 5, Depok" },
  { name: "Lestari Wulandari",phone: "+6287890123456", address: "Jl. Kenanga No. 22, Bekasi Selatan" },
  { name: "Hendra Wijaya",    phone: "+6288901234567", address: "Taman Harapan Indah Blok F3, Bekasi" },
  { name: "Nurul Hidayah",    phone: "+6289012345678", address: "Jl. Mawar Raya No. 8, Tangerang Selatan" },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  POHub Database Seeder");
  console.log(`  Target: ${SEED_EMAIL}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ── 1. Find User ─────────────────────────────────────────────────────────────

  section("User");
  const user = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (!user) {
    console.error(`\n  ❌ User "${SEED_EMAIL}" tidak ditemukan di tabel users.`);
    console.error("     Pastikan kamu sudah login sekali via browser sebelum menjalankan seeder.\n");
    process.exit(1);
  }
  log(`✅ Ditemukan: ${user.email} (id=${user.id.slice(0, 8)}...)`);

  // ── 2. Upsert Store ──────────────────────────────────────────────────────────

  section("Store");
  const existingStore = await prisma.store.findUnique({ where: { userId: user.id } });
  const storeSlug = existingStore?.slug ?? "kopi-sikon";
  const store = await prisma.store.upsert({
    where: { userId: user.id },
    update: {
      name: "KOPI SIKON",
      description: "Home business kopi rumahan pilihan dengan bahan-bahan premium. Menerima pre-order mingguan.",
      whatsapp: "081234567890",
      instagram: "@kopi.sikon",
      isActive: true,
    },
    create: {
      userId: user.id,
      name: "KOPI SIKON",
      slug: storeSlug,
      description: "Home business kopi rumahan pilihan dengan bahan-bahan premium. Menerima pre-order mingguan.",
      whatsapp: "081234567890",
      instagram: "@kopi.sikon",
      isActive: true,
    },
  });
  log(`✅ Store: "${store.name}" (slug=${store.slug})`);

  // ── 3. Upsert Ingredients ────────────────────────────────────────────────────

  section("Bahan Baku");
  const ingredientMap: Record<string, string> = {}; // name → id

  for (const ing of INGREDIENTS) {
    const existing = await prisma.ingredient.findFirst({
      where: { storeId: store.id, name: ing.name },
    });
    if (existing) {
      ingredientMap[ing.name] = existing.id;
      log(`  ↩ Skip (sudah ada): ${ing.name}`);
    } else {
      const created = await prisma.ingredient.create({
        data: {
          storeId: store.id,
          name: ing.name,
          unit: ing.unit,
          purchaseQty: ing.purchaseQty,
          purchasePrice: ing.purchasePrice,
        },
      });
      ingredientMap[ing.name] = created.id;
      log(`  ✅ Dibuat: ${ing.name} (${ing.purchaseQty} ${ing.unit} @ Rp ${ing.purchasePrice.toLocaleString()})`);
    }
  }

  // ── 4. Upsert Products ───────────────────────────────────────────────────────

  section("Produk");
  const productMap: Record<string, { id: string }> = {};

  for (const [idx, prod] of PRODUCTS.entries()) {
    let productId: string;

    const existing = await prisma.product.findFirst({
      where: { storeId: store.id, name: prod.name },
    });

    if (existing) {
      productId = existing.id;
      log(`  ↩ Skip (sudah ada): ${prod.name}`);
    } else {
      const created = await prisma.product.create({
        data: {
          storeId: store.id,
          name: prod.name,
          description: prod.description,
          category: prod.category,
          basePrice: prod.basePrice,
          status: prod.status,
          displayOrder: idx,
        },
      });
      productId = created.id;
      log(`  ✅ Dibuat: ${prod.name} (status=${prod.status})`);
    }

    productMap[prod.name] = { id: productId };
  }

  // ── 5. Upsert Recipe Items ────────────────────────────────────────────────────

  section("Resep & HPP");
  for (const prod of PRODUCTS) {
    const { id: productId } = productMap[prod.name];
    for (const item of prod.recipe) {
      const ingredientId = ingredientMap[item.ingredient];
      if (!ingredientId) {
        log(`  ⚠ Ingredient tidak ditemukan: ${item.ingredient}`);
        continue;
      }
      await prisma.recipeItem.upsert({
        where: { productId_ingredientId: { productId, ingredientId } },
        update: { quantity: item.quantity },
        create: { productId, ingredientId, quantity: item.quantity },
      });
    }
    log(`  ✅ Resep: ${prod.name} (${prod.recipe.length} bahan)`);
  }

  // ── 6. Campaigns + Orders ─────────────────────────────────────────────────────

  section("Kampanye PO");

  const publishedNames = PRODUCTS.filter((p) => p.status === "PUBLISHED").map((p) => p.name);
  const publishedProducts = publishedNames.map((n) => productMap[n]);

  // Compute HPP per recipe
  function computeHpp(productName: string): number {
    const prod = PRODUCTS.find((p) => p.name === productName)!;
    return prod.recipe.reduce((sum, item) => {
      const ing = INGREDIENTS.find((i) => i.name === item.ingredient)!;
      return sum + (item.quantity / ing.purchaseQty) * ing.purchasePrice;
    }, 0);
  }

  // Compute order totals from items
  type SeedItem = {
    productName: string;
    quantity: number;
  };

  function computeOrderTotals(items: SeedItem[]) {
    let totalAmount = 0;
    let totalHpp = 0;
    const orderItems = items.map((item) => {
      const prod = PRODUCTS.find((p) => p.name === item.productName)!;
      const unitPrice = prod.basePrice;
      const unitHpp = computeHpp(item.productName);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      totalHpp += unitHpp * item.quantity;
      return {
        productId: productMap[item.productName].id,
        productName: item.productName,
        unitPrice,
        unitHpp,
        quantity: item.quantity,
        subtotal,
      };
    });
    return { orderItems, totalAmount, totalHpp };
  }

  // Count existing orders for this store (for order number generation)
  async function nextOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.order.count({
      where: { campaign: { storeId: store.id } },
    });
    return `PO-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  // ── Campaign 1: COMPLETED ─────────────────────────────────────────────────────

  const campaign1Name = "PO Mingguan #3 - Mei 2026";
  let campaign1 = await prisma.campaign.findFirst({
    where: { storeId: store.id, name: campaign1Name },
  });

  if (campaign1) {
    log(`  ↩ Skip (sudah ada): ${campaign1Name}`);
  } else {
    campaign1 = await prisma.campaign.create({
      data: {
        storeId: store.id,
        name: campaign1Name,
        description: "Pre-order mingguan periode Mei 2026. Terima kasih atas kepercayaan kalian!",
        openDate: new Date("2026-05-05T08:00:00+07:00"),
        closeDate: new Date("2026-05-09T20:00:00+07:00"),
        status: CampaignStatus.COMPLETED,
        products: {
          create: publishedProducts.map((p) => ({ productId: p.id })),
        },
      },
    });
    log(`  ✅ Dibuat: ${campaign1Name} (COMPLETED)`);

    // Orders untuk campaign 1 - semua COMPLETED
    const ordersC1: { customer: typeof CUSTOMERS[0]; items: SeedItem[]; status: OrderStatus }[] = [
      {
        customer: CUSTOMERS[0],
        items: [
          { productName: "Kopi Susu Gula Aren", quantity: 2 },
          { productName: "Coklat Susu", quantity: 1 },
        ],
        status: OrderStatus.COMPLETED,
      },
      {
        customer: CUSTOMERS[1],
        items: [
          { productName: "Kopi Hitam", quantity: 3 },
        ],
        status: OrderStatus.COMPLETED,
      },
      {
        customer: CUSTOMERS[2],
        items: [
          { productName: "Kopi Susu Gula Aren", quantity: 1 },
          { productName: "Kopi Hitam", quantity: 2 },
          { productName: "Coklat Susu", quantity: 1 },
        ],
        status: OrderStatus.COMPLETED,
      },
    ];

    for (const o of ordersC1) {
      const { orderItems, totalAmount, totalHpp } = computeOrderTotals(o.items);
      const orderNumber = await nextOrderNumber();
      await prisma.order.create({
        data: {
          campaignId: campaign1.id,
          storeId: store.id,
          orderNumber,
          customerName: o.customer.name,
          customerPhone: o.customer.phone,
          customerAddress: o.customer.address,
          totalAmount,
          totalHpp,
          status: o.status,
          verifiedAt: o.status === OrderStatus.COMPLETED ? new Date("2026-05-10T10:00:00+07:00") : undefined,
          items: { create: orderItems },
        },
      });
      log(`    ✅ Order ${orderNumber}: ${o.customer.name} (${o.status})`);
    }

    // ProductionSheet untuk campaign 1
    const productionAggregates: Record<string, { name: string; unit: Unit; totalQty: number; cost: number }> = {};
    for (const o of ordersC1) {
      for (const item of o.items) {
        const prod = PRODUCTS.find((p) => p.name === item.productName)!;
        for (const ri of prod.recipe) {
          const ing = INGREDIENTS.find((i) => i.name === ri.ingredient)!;
          const key = ri.ingredient;
          const totalQtyNeeded = ri.quantity * item.quantity;
          const costPerUnit = ing.purchasePrice / ing.purchaseQty;
          if (!productionAggregates[key]) {
            productionAggregates[key] = { name: ri.ingredient, unit: ing.unit, totalQty: 0, cost: 0 };
          }
          productionAggregates[key].totalQty += totalQtyNeeded;
          productionAggregates[key].cost += costPerUnit * totalQtyNeeded;
        }
      }
    }

    await prisma.productionSheet.create({
      data: {
        campaignId: campaign1.id,
        generatedAt: new Date("2026-05-10T08:00:00+07:00"),
        items: {
          create: Object.values(productionAggregates).map((a) => ({
            ingredientId: ingredientMap[a.name],
            ingredientName: a.name,
            unit: a.unit,
            totalQuantity: Math.round(a.totalQty * 100) / 100,
            estimatedCost: Math.round(a.cost),
          })),
        },
      },
    });
    log(`    ✅ Production sheet dibuat untuk ${campaign1Name}`);
  }

  // ── Campaign 2: OPEN ──────────────────────────────────────────────────────────

  const campaign2Name = "PO Mingguan #4 - Juni 2026";
  let campaign2 = await prisma.campaign.findFirst({
    where: { storeId: store.id, name: campaign2Name },
  });

  if (campaign2) {
    log(`  ↩ Skip (sudah ada): ${campaign2Name}`);
  } else {
    campaign2 = await prisma.campaign.create({
      data: {
        storeId: store.id,
        name: campaign2Name,
        description: "Pre-order mingguan Juni 2026. Order ditutup 30 Juni pukul 20.00 WIB.",
        openDate: new Date("2026-06-01T08:00:00+07:00"),
        closeDate: new Date("2026-06-30T20:00:00+07:00"),
        status: CampaignStatus.OPEN,
        products: {
          create: publishedProducts.map((p) => ({ productId: p.id })),
        },
      },
    });
    log(`  ✅ Dibuat: ${campaign2Name} (OPEN)`);

    // Orders untuk campaign 2 - berbagai status
    const ordersC2: { customer: typeof CUSTOMERS[0]; items: SeedItem[]; status: OrderStatus; notes?: string }[] = [
      {
        customer: CUSTOMERS[3],
        items: [{ productName: "Kopi Susu Gula Aren", quantity: 2 }],
        status: OrderStatus.PENDING_PAYMENT,
      },
      {
        customer: CUSTOMERS[4],
        items: [
          { productName: "Coklat Susu", quantity: 1 },
          { productName: "Kopi Hitam", quantity: 1 },
        ],
        status: OrderStatus.PAYMENT_REVIEW,
      },
      {
        customer: CUSTOMERS[5],
        items: [
          { productName: "Kopi Hitam", quantity: 3 },
          { productName: "Kopi Susu Gula Aren", quantity: 2 },
        ],
        status: OrderStatus.PAID,
      },
      {
        customer: CUSTOMERS[6],
        items: [{ productName: "Kopi Susu Gula Aren", quantity: 4 }],
        status: OrderStatus.PRODUCTION,
        notes: "Tolong dibungkus rapi ya, untuk kado",
      },
      {
        customer: CUSTOMERS[7],
        items: [
          { productName: "Kopi Susu Gula Aren", quantity: 1 },
          { productName: "Coklat Susu", quantity: 2 },
        ],
        status: OrderStatus.PENDING_PAYMENT,
      },
      {
        customer: CUSTOMERS[8],
        items: [
          { productName: "Kopi Hitam", quantity: 2 },
          { productName: "Kopi Susu Gula Aren", quantity: 1 },
        ],
        status: OrderStatus.PAYMENT_REVIEW,
        notes: "Bayar via transfer BCA",
      },
    ];

    for (const o of ordersC2) {
      const { orderItems, totalAmount, totalHpp } = computeOrderTotals(o.items);
      const orderNumber = await nextOrderNumber();
      await prisma.order.create({
        data: {
          campaignId: campaign2.id,
          storeId: store.id,
          orderNumber,
          customerName: o.customer.name,
          customerPhone: o.customer.phone,
          customerAddress: o.customer.address,
          customerNotes: o.notes,
          totalAmount,
          totalHpp,
          status: o.status,
          verifiedAt: o.status === OrderStatus.PAID || o.status === OrderStatus.PRODUCTION
            ? new Date()
            : undefined,
          items: { create: orderItems },
        },
      });
      log(`    ✅ Order ${orderNumber}: ${o.customer.name} (${o.status})`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────

  const [ingCount, prodCount, campaignCount, orderCount] = await Promise.all([
    prisma.ingredient.count({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.campaign.count({ where: { storeId: store.id } }),
    prisma.order.count({ where: { campaign: { storeId: store.id } } }),
  ]);

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅ Seeding selesai!");
  console.log(`     Bahan Baku : ${ingCount}`);
  console.log(`     Produk     : ${prodCount}`);
  console.log(`     Kampanye   : ${campaignCount}`);
  console.log(`     Pesanan    : ${orderCount}`);
  console.log(`     Toko Publik: /${store.slug}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Seeder error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
