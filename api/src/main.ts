import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Állítsd be a frontend URL-t
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not in the DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are found
      transform: true, // Transform payloads to DTO instances
    })
  );

  await app.listen(3000);
}
bootstrap();
