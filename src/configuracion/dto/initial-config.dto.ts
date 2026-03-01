import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNumber, Max, Min } from "class-validator";

export enum Frecuencia {
  Semanal = "Semanal",
  Quincenal = "Quincenal",
  Mensual = "Mensual",
}

export class InitialConfigDto {
  @ApiProperty({ example: 15000, description: "Salario del usuario" })
  @IsNumber({}, { message: "El salario debe ser un número" })
  @Min(1, { message: "El salario es obligatorio" })
  salario: number;

  @ApiProperty({
    enum: Frecuencia,
    example: Frecuencia.Mensual,
    description: "Frecuencia de pago",
  })
  @IsEnum(Frecuencia, { message: "Frecuencia inválida" })
  frecuencia: Frecuencia;

  @ApiProperty({
    example: 1,
    description: "Día del mes en que inicia el ciclo",
  })
  @IsInt({ message: "El día debe ser un entero" })
  @Min(1)
  @Max(31)
  diaInicio: number;

  @ApiProperty({ example: 5000, description: "Saldo actual disponible" })
  @IsNumber()
  @Min(0, { message: "El saldo no puede ser negativo" })
  saldoActual: number;

  @ApiProperty({ example: 3000, description: "Ahorro histórico acumulado" })
  @IsNumber()
  @Min(0, { message: "El ahorro no puede ser negativo" })
  ahorroHistorico: number;
}
