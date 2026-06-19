import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ReceiptQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  invoiceId?: string;
}
