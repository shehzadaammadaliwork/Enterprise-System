import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig } from './common/config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get('frontendUrl', { infer: true }),
    credentials: true,
    exposedHeaders: ['x-csrf-token'],
  });

  app.setGlobalPrefix(configService.get('apiPrefix', { infer: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const port = configService.get('port', { infer: true });
  await app.listen(port);

  console.log(
    `Enterprise System API listening on http://localhost:${port}/${configService.get('apiPrefix', { infer: true })}`,
  );
}
bootstrap();
