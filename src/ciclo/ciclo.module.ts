import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CicloService } from "./ciclo.service";

@Module({
  imports: [PrismaModule],
  providers: [CicloService],
  exports: [CicloService],
})
export class CicloModule {}
