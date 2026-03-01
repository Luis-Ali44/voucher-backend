import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdatePagadoDto {
  @ApiProperty({ example: true, description: "Nuevo estado de pago" })
  @IsBoolean()
  pagado: boolean;
}
