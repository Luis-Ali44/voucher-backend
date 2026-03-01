import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PerfilController } from "./perfil.controller";
import { PerfilService } from "./perfil.service";

@Module({
  imports: [PrismaModule],
  controllers: [PerfilController],
  providers: [PerfilService],
  exports: [PerfilService],
})
export class PerfilModule {}
