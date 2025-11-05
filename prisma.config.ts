import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";

// Cargar variables de entorno desde el archivo .env
config({ override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
