import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RestockDto } from './dto/restock.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. Tambah Produk Baru (Kloter Pertama)
  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // 2. Restock (Tambah Kloter Baru untuk FIFO)
  @Post(':id/restock')
  @Roles('SUPERADMIN', 'ADMIN')
  restock(@Param('id') id: string, @Body() dto: RestockDto) {
    return this.productsService.restock(id, dto);
  }

  // 3. Ambil Semua Produk
  @Get()
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  findAll(@Query() query: PaginationQueryDto) {
    return this.productsService.findAll(query);
  }

  // 4. Ambil Satu Produk
  @Get(':id')
  @Roles('SUPERADMIN', 'ADMIN', 'GUDANG', 'EKSPEDISI')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 5. Update Data Dasar Produk
  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // 6. Hapus Produk
  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}