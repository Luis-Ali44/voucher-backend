import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InitialConfigDto } from "./dto/initial-config.dto";

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  async guardar(userId: string, dto: InitialConfigDto) {
    const config = await this.prisma.userConfig.upsert({
      where: { userId },
      create: {
        userId,
        salario: dto.salario,
        frecuencia: dto.frecuencia,
        diaInicio: dto.diaInicio,
        saldoActual: dto.saldoActual,
        ahorroHistorico: dto.ahorroHistorico,
      },
      update: {
        salario: dto.salario,
        frecuencia: dto.frecuencia,
        diaInicio: dto.diaInicio,
        saldoActual: dto.saldoActual,
        ahorroHistorico: dto.ahorroHistorico,
      },
    });

    return config;
  }

  async obtener(userId: string) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        "Configuración no encontrada para este usuario",
      );
    }

    return config;
  }
}
