import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'RAHASIA_SUPER_KUAT_BERDIKARI_2026', // Di versi production, ini harus pakai file .env
      signOptions: { expiresIn: '1d' }, // Token otomatis hangus dalam 1 hari
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
