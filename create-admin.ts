// prisma/create-admin.ts
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = "admin@fitnest.local";
  const password = "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: {
      email,
    },
    update: {
      name: "Admin User",
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: "Admin User",
      email,
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });

  console.log(
    `Admin user with email "${email}" has been created/updated successfully.`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
