/**
 * Insère un acteur de démo (FARMER) pour tester le dashboard.
 * Usage: node src/scripts/seed-actor.js
 * Ou avec un compte précis: node src/scripts/seed-actor.js 0.0.12345 FARMER
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const accountId = process.argv[2] || "0.0.12345";
const role = process.argv[3] || "FARMER";

async function main() {
  const actor = await prisma.actor.upsert({
    where: { hederaAccount: accountId },
    update: { role },
    create: { hederaAccount: accountId, role },
  });
  console.log("Acteur créé ou mis à jour:", actor.hederaAccount, "·", actor.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
