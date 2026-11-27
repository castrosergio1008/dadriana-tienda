-- Initial schema for the app_config table used by the Home content loader.
-- Idempotent on purpose: prisma/fixtures.mjs may already have created the table
-- in an ephemeral CI database, and its rows must be preserved.
CREATE TABLE IF NOT EXISTS "app_config" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_config_pkey" PRIMARY KEY ("key")
);
