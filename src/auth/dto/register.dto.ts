import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "Juan Pérez",
    description: "Nombre completo del usuario",
  })
  @IsString()
  @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
  name: string;

  @ApiProperty({
    example: "usuario@email.com",
    description: "Correo electrónico",
  })
  @IsEmail({}, { message: "Formato de correo inválido" })
  email: string;

  @ApiProperty({
    example: "12345678",
    description: "Contraseña (mínimo 6 caracteres)",
  })
  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password: string;
}
