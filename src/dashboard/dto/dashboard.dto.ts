import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

enum CategoriaGasto {
  Vital = "Vital",
  Recurrente = "Recurrente",
  Variable = "Variable",
}

enum Frecuencia {
  Semanal = "Semanal",
  Quincenal = "Quincenal",
  Mensual = "Mensual",
}

export class RegistrarGastoDto {
  @ApiProperty({ example: "Gasolina", description: "Nombre del gasto" })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ enum: CategoriaGasto, example: CategoriaGasto.Variable })
  @IsEnum(CategoriaGasto)
  categoria: CategoriaGasto;

  @ApiProperty({ enum: Frecuencia, required: false })
  @IsOptional()
  @IsEnum(Frecuencia)
  frecuencia?: Frecuencia;
}

export class RegistrarIngresoExtraDto {
  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiProperty({ example: "Freelance", required: false })
  @IsOptional()
  @IsString()
  origen?: string;

  @ApiProperty({
    example: false,
    description: "Si true, se reserva para el siguiente ciclo",
  })
  @IsBoolean()
  reservar: boolean;
}
