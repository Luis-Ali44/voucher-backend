import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { CicloModule } from "./ciclo/ciclo.module";
import { ConfiguracionModule } from "./configuracion/configuracion.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { GastosModule } from "./gastos/gastos.module";
import { HealthModule } from "./health/health.module";
import { PerfilModule } from "./perfil/perfil.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ConfiguracionModule,
    GastosModule,
    DashboardModule,
    HealthModule,
    PerfilModule,
    CicloModule,
  ],
})
export class AppModule {}
