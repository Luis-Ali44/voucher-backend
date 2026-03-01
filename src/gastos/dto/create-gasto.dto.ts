import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export enum CategoriaGasto {
  Vital = "Vital",
  Recurrente = "Recurrente",
}

export enum Frecuencia {
  Semanal = "Semanal",
  Quincenal = "Quincenal",
  Mensual = "Mensual",
}

export class CreateGastoDto {
  @ApiProperty({ example: "Renta", description: "Nombre del gasto" })
  @IsString()
  @MinLength(1, { message: "El nombre del gasto es obligatorio" })
  nombre: string;

  @ApiProperty({ example: 3500, description: "Monto del gasto" })
  @IsNumber()
  @Min(0.01, { message: "El monto debe ser mayor a 0" })
  monto: number;

  @ApiProperty({ enum: CategoriaGasto, example: CategoriaGasto.Vital })
  @IsEnum(CategoriaGasto, { message: "Categoría inválida" })
  categoria: CategoriaGasto;

  @ApiProperty({ enum: Frecuencia, example: Frecuencia.Mensual })
  @IsEnum(Frecuencia, { message: "Frecuencia inválida" })
  frecuencia: Frecuencia;

  @ApiProperty({ example: false, description: "Si el gasto ya fue pagado" })
  @IsBoolean()
  pagado: boolean;
}
