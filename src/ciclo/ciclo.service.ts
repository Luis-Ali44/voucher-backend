import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Frecuencia } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CicloService {
  private readonly logger = new Logger(CicloService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Se ejecuta cada día a las 00:05 AM.
   * Revisa todos los usuarios y, si hoy es el día de inicio de su ciclo,
   * dispara el reinicio: resetea gastos, aplica pendingConfig y libera reservas.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async revisarCiclos() {
    this.logger.log("Revisando ciclos de cobro...");

    const hoy = new Date().getDate(); // día del mes actual (1-31)

    const configs = await this.prisma.userConfig.findMany({
      where: { diaInicio: hoy },
    });

    this.logger.log(`Usuarios con ciclo hoy (día ${hoy}): ${configs.length}`);

    for (const config of configs) {
      try {
        await this.reiniciarCicloUsuario(config.userId);
        this.logger.log(`Ciclo reiniciado para usuario ${config.userId}`);
      } catch (err) {
        this.logger.error(
          `Error reiniciando ciclo para ${config.userId}: ${err}`,
        );
      }
    }
  }

  /**
   * Reinicia el ciclo de un usuario específico:
   * 1. Aplica pendingConfig (salario / frecuencia / diaInicio diferidos)
   * 2. Agrega al saldoActual el nuevo salario
   * 3. Libera los ingresos reservados (burbujas) sumándolos al saldoActual
   * 4. Resetea pagado=false en gastos activos (excluye canceladoParaElFuturo)
   * 5. Elimina físicamente los gastos cancelados para el futuro
   */
  async reiniciarCicloUsuario(userId: string) {
    const config = await this.prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) return;

    const pending =
      (config.pendingConfig as Record<string, unknown> | null) ?? {};

    // Nuevo salario a aplicar (pendiente o el actual)
    const nuevoSalario =
      typeof pending.salario === "number" ? pending.salario : config.salario;
    const nuevaFrecuencia =
      typeof pending.frecuencia === "string"
        ? (pending.frecuencia as Frecuencia)
        : config.frecuencia;
    const nuevoDiaInicio =
      typeof pending.diaInicio === "number"
        ? pending.diaInicio
        : config.diaInicio;

    // Ingresos reservados en este ciclo
    const ingresosReservados = await this.prisma.ingresoExtra.findMany({
      where: { userId, reservado: true },
    });
    const totalReservado = ingresosReservados.reduce(
      (sum, i) => sum + i.monto,
      0,
    );

    // Nuevo saldo = salario nuevo + reservas liberadas
    const nuevoSaldo = nuevoSalario + totalReservado;

    // 1. Actualizar configuración (aplicar pending y nuevo saldo)
    await this.prisma.userConfig.update({
      where: { userId },
      data: {
        salario: nuevoSalario,
        frecuencia: nuevaFrecuencia,
        diaInicio: nuevoDiaInicio,
        saldoActual: nuevoSaldo,
        ahorroHistorico: config.ahorroHistorico, // se mantiene (el usuario lo actualiza manualmente)
        pendingConfig: null, // limpiar el payload en espera
      },
    });

    // 2. Liberar las burbujas de ingresos reservados (eliminarlas del registro)
    if (ingresosReservados.length > 0) {
      await this.prisma.ingresoExtra.deleteMany({
        where: {
          userId,
          reservado: true,
        },
      });
    }

    // 3. Eliminar físicamente los gastos que fueron cancelados para el futuro
    await this.prisma.gasto.deleteMany({
      where: { userId, canceladoParaElFuturo: true },
    });

    // 4. Resetear todos los gastos activos a pagado=false para el nuevo ciclo
    await this.prisma.gasto.updateMany({
      where: { userId, canceladoParaElFuturo: false },
      data: { pagado: false },
    });
  }
}
