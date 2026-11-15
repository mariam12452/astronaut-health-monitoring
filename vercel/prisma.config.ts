import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` needs no database, so a placeholder lets it run at build time before DATABASE_URL exists.
    url: process.env.DATABASE_URL ?? "postgresql://build:build@localhost:5432/build",
  },
});
