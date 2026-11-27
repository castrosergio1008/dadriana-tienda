// CI-only fixture loader. Seeds synthetic app_config values into a local
// PostgreSQL database. It deliberately refuses any non-local DATABASE_URL so a
// mistyped CI variable can never write to a real deployment database.
import { PrismaClient } from '@prisma/client';
import { assertLocalDatabaseUrl, FixtureGuardError } from './db-guard.mjs';

// Mirrors prisma/schema.prisma so an ephemeral CI database needs no migration
// step before fixtures are loaded. Static SQL only: no user input is embedded.
const ENSURE_APP_CONFIG_TABLE = `
  CREATE TABLE IF NOT EXISTS "app_config" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
  )
`;

// Synthetic values only. These keys never contain customer data or PII.
const FIXTURES = [
  ['whatsapp_number', '573001234567'],
  ['instagram_url', 'https://www.instagram.com/dadriana_test'],
  ['facebook_url', 'https://www.facebook.com/dadriana.test'],
  ['stores', []],
  [
    'selections',
    {
      mas_vendidos: [
        {
          slug: 'fixture-serum-qa',
          name: 'Sérum sintético QA',
          availability: 'available',
        },
      ],
      mas_referenciados: [
        {
          slug: 'fixture-crema-qa',
          name: 'Crema sintética QA',
          availability: 'out_of_stock',
        },
      ],
    },
  ],
];

function safeErrorType(error) {
  if (error instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name)) {
    return error.name;
  }
  return 'UnknownError';
}

async function main() {
  // Validate before creating a client: no connection attempt is made for a
  // non-local URL, and the URL itself is never written to logs.
  assertLocalDatabaseUrl(process.env.DATABASE_URL);

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(ENSURE_APP_CONFIG_TABLE);
    await prisma.$transaction(async (tx) => {
      for (const [key, value] of FIXTURES) {
        await tx.appConfig.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
    });
  } finally {
    await prisma.$disconnect();
  }

  // Never print the connection string, credentials or seeded values.
  console.log(`Loaded ${FIXTURES.length} synthetic app_config rows into the local database.`);
}

main().catch((error) => {
  if (error instanceof FixtureGuardError) {
    console.error(error.message);
  } else {
    // Prisma errors may embed the connection string: log only the error type.
    console.error(`Fixture loading failed (${safeErrorType(error)}).`);
  }
  process.exitCode = 1;
});
