import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  RegistrarGastoDto,
  RegistrarIngresoExtraDto,
} from "./dto/dashboard.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumen(userId: string) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException(
        "El usuario aún no tiene configuración registrada",
      );
    }

    // Solo gastos activos (excluir los cancelados para el futuro)
    const gastos = await this.prisma.gasto.findMany({
      where: { userId, canceladoParaElFuturo: false },
    });
    const ingresosExtra = await this.prisma.ingresoExtra.findMany({
      where: { userId },
    });

    const gastosPendientesTotales = gastos
      .filter((g) => !g.pagado)
      .reduce((sum, g) => sum + g.monto, 0);

    const reservadoSiguienteCiclo = ingresosExtra
      .filter((i) => i.reservado)
      .reduce((sum, i) => sum + i.monto, 0);

    // FÓRMULA CORRECTA: Saldo Total - Gastos Pendientes - Reservado Siguiente Ciclo
    const saldoActual =
      config.saldoActual - gastosPendientesTotales - reservadoSiguienteCiclo;

    const baseAhorro = config.ahorroHistorico;
    const objetivoMeta = baseAhorro > 0 ? baseAhorro * 1.23 : 1000;
    const montoAhorrado = Math.max(0, saldoActual);
    const porcentajeActual = Math.min(
      100,
      Math.round((montoAhorrado / objetivoMeta) * 100),
    );

    const gastosRegistrados = gastos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      montoProrrateado: g.monto,
      tipo: g.categoria,
      pagado: g.pagado,
    }));

    return {
      saldoActual,
      saldoTotal: config.saldoActual,
      gastosPendientesTotales,
      reservadoSiguienteCiclo,
      metaCrecimiento: {
        porcentajeActual,
        porcentajeObjetivo: 23,
        montoAhorrado,
      },
      gastosRegistrados,
    };
  }

  async registrarGasto(userId: string, dto: RegistrarGastoDto) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException("Configuración no encontrada");
    }

    // Descontar del saldo actual
    await this.prisma.userConfig.update({
      where: { userId },
      data: { saldoActual: Math.max(0, config.saldoActual - dto.monto) },
    });

    if (dto.categoria === "Variable") {
      // Gasto variable: transacción única con historial
      await this.prisma.transaccion.create({
        data: { userId, nombre: dto.nombre, monto: dto.monto },
      });
    } else {
      // Gasto fijo: se registra como compromiso futuro
      await this.prisma.gasto.create({
        data: {
          userId,
          nombre: dto.nombre,
          monto: dto.monto,
          categoria: dto.categoria as any,
          frecuencia: (dto.frecuencia ?? "Mensual") as any,
          pagado: true,
        },
      });
    }

    return { message: "Gasto registrado correctamente" };
  }

  async registrarIngresoExtra(userId: string, dto: RegistrarIngresoExtraDto) {
    await this.prisma.ingresoExtra.create({
      data: {
        userId,
        monto: dto.monto,
        origen: dto.origen,
        reservado: dto.reservar,
      },
    });

    // Si no se reserva, se suma al saldo actual
    if (!dto.reservar) {
      const config = await this.prisma.userConfig.findUnique({
        where: { userId },
      });
      if (config) {
        await this.prisma.userConfig.update({
          where: { userId },
          data: { saldoActual: config.saldoActual + dto.monto },
        });
      }
    }

    return { message: "Ingreso extra registrado correctamente" };
  }
}
