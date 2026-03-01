import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "usuario@email.com",
    description: "Correo electrónico del usuario",
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
