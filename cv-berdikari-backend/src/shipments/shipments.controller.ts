import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ShipmentsService } from './shipments.service';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/awb', // Mengarahkan foto resi ke folder baru
        filename: (req, file, cb) => {
          // Membuat nama file otomatis jadi unik
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `RESI-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  create(
    @Body() createShipmentDto: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // 1. Jika ada foto resi (AWB) yang diunggah, simpan nama URL-nya
    if (file) {
      createShipmentDto.proofUrl = `/uploads/awb/${file.filename}`;
    }

    // 2. PERBAIKAN: Paksa konversi string dari FormData kembali menjadi Number
    // Ini memastikan validasi database dan DTO NestJS tidak menolak data yang masuk
    if (createShipmentDto.shippingCost) {
      createShipmentDto.shippingCost = Number(createShipmentDto.shippingCost);
    }
    if (createShipmentDto.otherFees) {
      createShipmentDto.otherFees = Number(createShipmentDto.otherFees);
    }

    // 3. Teruskan data yang sudah bersih ke Service
    return this.shipmentsService.createShipment(createShipmentDto);
  }

  @Get()
  findAll() {
    return this.shipmentsService.findAll();
  }
}
