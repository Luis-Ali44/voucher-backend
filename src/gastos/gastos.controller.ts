import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreateGastoDto } from "./dto/create-gasto.dto";
import { UpdatePagadoDto } from "./dto/update-pagado.dto";
import { GastosService } from "./gastos.service";

@ApiTags("Gastos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("gastos")
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  @Post()
  @ApiOperation({ summary: "Registrar un gasto" })
  @ApiResponse({ status: 201, description: "Gasto creado" })
  crear(@Request() req, @Body() dto: CreateGastoDto) {
    return this.gastosService.crear(req.user.id, dto);
  }

  @Post("lote")
  @ApiOperation({
    summary:
      "Registrar múltiples gastos de una sola vez (configuración inicial)",
  })
  @ApiResponse({ status: 201, description: "Gastos creados en lote" })
  crearLote(@Request() req, @Body() gastos: CreateGastoDto[]) {
    return this.gastosService.crearLote(req.user.id, gastos);
  }

  @Get()
  @ApiOperation({ summary: "Obtener todos los gastos del usuario" })
  @ApiResponse({ status: 200, description: "Lista de gastos" })
  findAll(@Request() req) {
    return this.gastosService.findAllByUser(req.user.id);
  }

  @Patch(":id/pagado")
  @ApiOperation({ summary: "Marcar o desmarcar un gasto como pagado" })
  @ApiResponse({ status: 200, description: "Estado actualizado" })
  @ApiResponse({ status: 404, description: "Gasto no encontrado" })
  updatePagado(
    @Request() req,
    @Param("id") id: string,
    @Body() dto: UpdatePagadoDto,
  ) {
    return this.gastosService.updatePagado(req.user.id, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar un gasto" })
  @ApiResponse({ status: 200, description: "Gasto eliminado" })
  @ApiResponse({ status: 404, description: "Gasto no encontrado" })
  eliminar(@Request() req, @Param("id") id: string) {
    return this.gastosService.eliminar(req.user.id, id);
  }
}
