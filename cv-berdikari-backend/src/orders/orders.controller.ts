import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs'; // <-- Tambahan library untuk mengelola folder
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      // 1. LOGIKA BARU: Cek dan buat folder otomatis jika belum ada!
      destination: (req, file, cb) => {
        const dir = './uploads/po';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      // 2. Format penamaan file PDF
      filename: (req, file, cb) => {
        const rawPoNumber = req.body.poNumber || 'PO-BARU';
        const poNumber = rawPoNumber.replace(/[^a-zA-Z0-9-]/g, ''); // Bersihkan karakter aneh
        
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}_${month}_${year}`;
        
        const ext = extname(file.originalname);
        cb(null, `${poNumber}_${formattedDate}${ext}`);
      }
    })
  }))
  create(@Body() createOrderDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createOrderDto.poDocumentUrl = `/uploads/po/${file.filename}`;
    }
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}