import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("VauCher API")
    .setDescription("Backend de planificación financiera inteligente")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const { apiReference } = await import("@scalar/nestjs-api-reference");

  app.use(
    "/docs",
    apiReference({
      spec: { content: document },
      theme: "default",
      defaultHttpClient: {
        targetKey: "javascript",
        clientKey: "fetch",
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`VauCher API corriendo en: http://localhost:${port}/api`);
  console.log(`Documentación Scalar en:  http://localhost:${port}/docs`);
}

bootstrap();
