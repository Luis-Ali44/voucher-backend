import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException("Ya existe un usuario con ese correo");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    const token = this.signToken(user.id, user.email);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException("Credenciales incorrectas");
    }

    const token = this.signToken(user.id, user.email);

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  private signToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
