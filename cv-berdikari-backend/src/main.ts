import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Kita beri tahu NestJS bahwa kita menggunakan mesin Express agar bisa menyajikan file statis
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. IZINKAN CORS: Agar aplikasi frontend (React) bisa mengakses server ini dari domain Vercel nanti
  app.enableCors();

  // 2. VALIDATION PIPE: Agar decorator di DTO (@IsString, @Min, dll) berfungsi otomatis
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 3. STATIC ASSETS: Membuka gembok folder 'uploads' agar PDF Purchase Order bisa diakses
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 4. PORT DINAMIS: Wajib untuk deployment di Cloud (Render/Heroku/dsb)
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port: ${port}`);
}
bootstrap();
