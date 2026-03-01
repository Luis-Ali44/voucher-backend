import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Verificar estado del servicio y conexión a BD" })
  async check() {
    let db = "ok";
    let dbError: string | null = null;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      db = "error";
      dbError = err instanceof Error ? err.message : String(err);
    }

    return {
      status: db === "ok" ? "ok" : "degraded",
      api: "ok",
      db,
      ...(dbError ? { dbError } : {}),
      timestamp: new Date().toISOString(),
    };
  }
}
