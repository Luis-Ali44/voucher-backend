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
import { DashboardService } from "./dashboard.service";
import {
  RegistrarGastoDto,
  RegistrarIngresoExtraDto,
} from "./dto/dashboard.dto";

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("resumen")
  @ApiOperation({ summary: "Obtener resumen financiero del usuario" })
  @ApiResponse({ status: 200, description: "Resumen del dashboard" })
  @ApiResponse({ status: 404, description: "Sin configuración registrada" })
  getResumen(@Request() req) {
    return this.dashboardService.getResumen(req.user.id);
  }

  @Post("gasto")
  @ApiOperation({ summary: "Registrar un gasto desde el dashboard" })
  @ApiResponse({ status: 201, description: "Gasto registrado" })
  registrarGasto(@Request() req, @Body() dto: RegistrarGastoDto) {
    return this.dashboardService.registrarGasto(req.user.id, dto);
  }

  @Post("ingreso-extra")
  @ApiOperation({ summary: "Registrar un ingreso extra" })
  @ApiResponse({ status: 201, description: "Ingreso extra registrado" })
  registrarIngresoExtra(@Request() req, @Body() dto: RegistrarIngresoExtraDto) {
    return this.dashboardService.registrarIngresoExtra(req.user.id, dto);
  }
}
