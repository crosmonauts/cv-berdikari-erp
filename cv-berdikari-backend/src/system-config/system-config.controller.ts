import { Controller, Get, Put, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemConfigService } from './system-config.service';
import { UpdatePpnDto } from './dto/update-ppn.dto';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('ppn')
  get() {
    return this.service.getPpnRate().then((r) => ({ rate: r }));
  }

  @Put('ppn')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Body() dto: UpdatePpnDto, @Req() req: any) {
    return this.service.setPpnRate(dto.rate, req.user.sub);
  }
}
