import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. Tambah Produk Baru (Kloter Pertama)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // 2. Restock (Tambah Kloter Baru untuk FIFO)
  @Post(':id/restock')
  restock(@Param('id') id: string, @Body() body: { quantity: number, purchasePrice: number }) {
    return this.productsService.restock(id, body);
  }

  // 3. Ambil Semua Produk
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // 4. Ambil Satu Produk
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // 5. Update Data Dasar Produk
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // 6. Hapus Produk
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}