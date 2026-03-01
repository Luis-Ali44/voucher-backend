import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGastoDto } from "./dto/create-gasto.dto";
import { UpdatePagadoDto } from "./dto/update-pagado.dto";

@Injectable()
export class GastosService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(userId: string, dto: CreateGastoDto) {
    return this.prisma.gasto.create({
      data: {
        userId,
        nombre: dto.nombre,
        monto: dto.monto,
        categoria: dto.categoria,
        frecuencia: dto.frecuencia,
        pagado: dto.pagado,
      },
    });
  }

  async crearLote(userId: string, gastos: CreateGastoDto[]) {
    const data = gastos.map((g) => ({
      userId,
      nombre: g.nombre,
      monto: g.monto,
      categoria: g.categoria,
      frecuencia: g.frecuencia,
      pagado: g.pagado,
    }));

    await this.prisma.gasto.createMany({ data });

    return { creados: data.length };
  }

  async findAllByUser(userId: string) {
    return this.prisma.gasto.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updatePagado(userId: string, gastoId: string, dto: UpdatePagadoDto) {
    const gasto = await this.prisma.gasto.findFirst({
      where: { id: gastoId, userId },
    });

    if (!gasto) {
      throw new NotFoundException("Gasto no encontrado");
    }

    return this.prisma.gasto.update({
      where: { id: gastoId },
      data: { pagado: dto.pagado },
    });
  }

  async eliminar(userId: string, gastoId: string) {
    const gasto = await this.prisma.gasto.findFirst({
      where: { id: gastoId, userId },
    });

    if (!gasto) {
      throw new NotFoundException("Gasto no encontrado");
    }

    // Soft delete: marca el gasto para que el próximo ciclo lo ignore,
    // pero el ciclo actual sigue computando el monto correctamente.
    await this.prisma.gasto.update({
      where: { id: gastoId },
      data: { canceladoParaElFuturo: true },
    });

    return { message: "Gasto cancelado para el próximo ciclo" };
  }
}
