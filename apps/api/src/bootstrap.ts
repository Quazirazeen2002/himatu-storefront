import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger, ConsoleLogger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/exception.filter";
export async function createApplication(server = express()) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: new ConsoleLogger({ json: true }),
  });
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: config.get("WEB_ORIGIN"),
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      const id = randomUUID(),
        start = Date.now();
      res.setHeader("X-Request-Id", id);
      res.on("finish", () =>
        Logger.log(
          JSON.stringify({
            event: "http",
            requestId: id,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Date.now() - start,
          }),
        ),
      );
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  if (config.get("NODE_ENV") !== "production") {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("HIMATU API")
        .setVersion("1")
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup("api/docs", app, document);
  }
  app.enableShutdownHooks();
  await app.init();
  return app;
}
