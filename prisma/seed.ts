import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@repairtrack.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Administrator",
      email,
      password: hashed,
      role: "admin",
      mustChangePass: true,
    },
  });

  await prisma.systemSettings.createMany({
    data: [
      { key: "shop_name", value: "RepairTrack" },
      { key: "shop_logo", value: "" },
      { key: "app_version", value: "1.0.0" },
    ],
    skipDuplicates: true,
  });

  console.log(`Admin user created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
