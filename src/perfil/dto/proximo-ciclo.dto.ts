import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

enum Frecuencia {
  Semanal = "Semanal",
  Quincenal = "Quincenal",
  Mensual = "Mensual",
}

export class ProximoCicloDto {
  @ApiProperty({
    example: 18000,
    description: "Nuevo salario a aplicar al inicio del próximo ciclo",
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "El salario debe ser un número" })
  @Min(1)
  salario?: number;

  @ApiProperty({
    enum: Frecuencia,
    example: Frecuencia.Mensual,
    description: "Nueva frecuencia de pago para el próximo ciclo",
    required: false,
  })
  @IsOptional()
  @IsEnum(Frecuencia)
  frecuencia?: Frecuencia;

  @ApiProperty({
    example: 1,
    description: "Nuevo día de inicio del ciclo (aplica al próximo ciclo)",
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaInicio?: number;
}
