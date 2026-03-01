import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Captura todas las excepciones y devuelve el mensaje real en desarrollo.
 * En producción solo expone el mensaje genérico.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDev = process.env.NODE_ENV !== "production";

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else if (exception instanceof Error) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${exception.message}`,
        exception.stack,
      );
      message = isDev ? exception.message : "Internal server error";
    } else {
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
