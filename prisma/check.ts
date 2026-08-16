import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDatabaseSchema } from "../src/lib/database-url";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.error(
    "DATABASE_URL is not configured. Set it in .env before checking PostgreSQL.",
  );
  process.exit(1);
}

const db = new PrismaClient({
  adapter: new PrismaPg(
    { connectionString },
    { schema: getDatabaseSchema(connectionString) },
  ),
});

async function main() {
  const [{ ok }] = await db.$queryRaw<Array<{ ok: number }>>`select 1 as ok`;
  const [categories, seedTopics, keywords, questions] = await Promise.all([
    db.category.count(),
    db.seedTopic.count(),
    db.keyword.count(),
    db.question.count(),
  ]);

  console.log(
    `PostgreSQL OK: select=${ok}, categories=${categories}, seedTopics=${seedTopics}, keywords=${keywords}, questions=${questions}`,
  );
}

main()
  .catch((error) => {
    console.error(`PostgreSQL connection failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
