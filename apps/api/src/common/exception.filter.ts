import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private logger = new Logger("HTTP");
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const req = host.switchToHttp().getRequest();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const details =
      error instanceof HttpException
        ? error.getResponse()
        : { message: "Internal server error" };
    if (status >= 500)
      this.logger.error(
        JSON.stringify({
          event: "request_failed",
          status,
          method: req.method,
          path: req.path,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      );
    response
      .status(status)
      .json({
        statusCode: status,
        ...(typeof details === "object" ? details : { message: details }),
      });
  }
}
