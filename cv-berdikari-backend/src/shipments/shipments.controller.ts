import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ShipmentsService } from './shipments.service';
import { fileFilter, limits } from '../common/utils/file-upload.util';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/awb',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `RESI-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter,
      limits,
    }),
  )
  create(
    @Body() createShipmentDto: CreateShipmentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      createShipmentDto.proofUrl = `/uploads/awb/${file.filename}`;
    }

    return this.shipmentsService.createShipment(createShipmentDto);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  findAll(@Query() query: PaginationQueryDto) {
    return this.shipmentsService.findAll(query);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'EKSPEDISI')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateShipmentDto) {
    return this.shipmentsService.update(id, body);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
