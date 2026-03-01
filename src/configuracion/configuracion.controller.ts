import {
  Body,
  Controller,
  Get,
  Post,
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
import { ConfiguracionService } from "./configuracion.service";
import { InitialConfigDto } from "./dto/initial-config.dto";

@ApiTags("Configuración")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("configuracion")
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Post()
  @ApiOperation({ summary: "Guardar configuración financiera inicial" })
  @ApiResponse({
    status: 201,
    description: "Configuración guardada o actualizada",
  })
  guardar(@Request() req, @Body() dto: InitialConfigDto) {
    return this.configuracionService.guardar(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "Obtener configuración del usuario autenticado" })
  @ApiResponse({ status: 200, description: "Configuración encontrada" })
  @ApiResponse({ status: 404, description: "Sin configuración registrada" })
  obtener(@Request() req) {
    return this.configuracionService.obtener(req.user.id);
  }
}
