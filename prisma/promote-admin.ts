import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL ?? process.argv[2];

async function main() {
  if (!email) {
    console.error("\n❌ Usage: ADMIN_EMAIL=user@example.com npm run admin:promote");
    console.error("   (or: npm run admin:promote -- user@example.com)\n");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`\n❌ User "${email}" tidak ditemukan.`);
    console.error("   Pastikan user sudah login sekali via browser sebelum dipromosikan.\n");
    process.exit(1);
  }

  if (user.role === "SUPER_ADMIN") {
    console.log(`\n✅ "${email}" sudah menjadi SUPER_ADMIN.\n`);
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
  console.log(`\n✅ "${email}" sekarang menjadi SUPER_ADMIN.\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Gagal mempromosikan admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
