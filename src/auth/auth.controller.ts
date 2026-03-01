import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Registrar nuevo usuario" })
  @ApiResponse({ status: 201, description: "Usuario registrado correctamente" })
  @ApiResponse({ status: 409, description: "El correo ya está en uso" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Iniciar sesión" })
  @ApiResponse({ status: 200, description: "Login exitoso, retorna JWT" })
  @ApiResponse({ status: 401, description: "Credenciales incorrectas" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
