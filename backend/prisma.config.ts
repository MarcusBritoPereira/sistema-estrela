import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "sqlserver://192.168.3.64:1433;database=DistribuidoraEstrela;user=bi_user;password=Marcu$2603;encrypt=false;trustServerCertificate=true;TrustServerCertificate=true",
  },
});
