import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs'; // <-- Tambahan library untuk mengelola folder
import { OrdersService } from './orders.service';
import { fileFilter, limits } from '../common/utils/file-upload.util';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads/po';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const rawPoNumber = req.body.poNumber || 'PO-BARU';
        const poNumber = rawPoNumber.replace(/[^a-zA-Z0-9-]/g, '');
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}_${month}_${year}`;
        const ext = extname(file.originalname);
        cb(null, `${poNumber}_${formattedDate}${ext}`);
      }
    }),
    fileFilter,
    limits,
  }))
  create(@Body() createOrderDto: CreateOrderDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createOrderDto.poDocumentUrl = `/uploads/po/${file.filename}`;
    }
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  findAll(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get('counts')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  counts() {
    return this.ordersService.getCounts();
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}