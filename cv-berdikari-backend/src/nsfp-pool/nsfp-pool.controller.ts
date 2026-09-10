import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NsfpPoolService } from './nsfp-pool.service';
import { CreateNsfpPoolDto } from './dto/create-nsfp-pool.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nsfp-pool')
export class NsfpPoolController {
  constructor(private readonly service: NsfpPoolService) {}

  @Post()
  @Roles('SUPERADMIN')
  create(@Body() dto: CreateNsfpPoolDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
