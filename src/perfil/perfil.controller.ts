import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProximoCicloDto } from "./dto/proximo-ciclo.dto";
import { PerfilService } from "./perfil.service";

@ApiTags("Perfil")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("perfil")
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Patch("proximo-ciclo")
  @ApiOperation({
    summary: "Guardar cambios de configuración para el próximo ciclo",
    description:
      "Los cambios de salario, día de inicio o frecuencia se guardan en espera y se aplican únicamente cuando inicie el siguiente ciclo de cobro.",
  })
  @ApiResponse({
    status: 200,
    description: "Cambios guardados en pendingConfig",
  })
  @ApiResponse({ status: 404, description: "Sin configuración registrada" })
  guardarProximoCiclo(@Request() req, @Body() dto: ProximoCicloDto) {
    return this.perfilService.guardarProximoCiclo(req.user.id, dto);
  }

  @Get("pendiente")
  @ApiOperation({
    summary: "Obtener los cambios pendientes para el próximo ciclo",
  })
  @ApiResponse({ status: 200, description: "Payload pendiente" })
  obtenerPendiente(@Request() req) {
    return this.perfilService.obtenerPendiente(req.user.id);
  }
}
