import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ProximoCicloDto } from "./dto/proximo-ciclo.dto";

@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  async guardarProximoCiclo(userId: string, dto: ProximoCicloDto) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        "El usuario aún no tiene configuración registrada",
      );
    }

    // Mezclamos el payload en espera existente con los nuevos valores.
    // Los cambios NO se aplican al ciclo actual; se guardarán en pendingConfig
    // y el cronjob los aplicará al inicio del próximo ciclo.
    const existingPending =
      (config.pendingConfig as Record<string, unknown>) ?? {};

    const newPending: Record<string, unknown> = { ...existingPending };

    if (dto.salario !== undefined) newPending.salario = dto.salario;
    if (dto.frecuencia !== undefined) newPending.frecuencia = dto.frecuencia;
    if (dto.diaInicio !== undefined) newPending.diaInicio = dto.diaInicio;

    await this.prisma.userConfig.update({
      where: { userId },
      data: { pendingConfig: newPending as Prisma.InputJsonValue },
    });

    return {
      message:
        "Cambios guardados. Se aplicarán al inicio del próximo ciclo de cobro.",
      pendingConfig: newPending,
    };
  }

  async obtenerPendiente(userId: string) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException("Configuración no encontrada");
    }

    return { pendingConfig: config.pendingConfig ?? null };
  }
}
