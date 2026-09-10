import { Module } from '@nestjs/common';
import { NsfpPoolService } from './nsfp-pool.service';
import { NsfpPoolController } from './nsfp-pool.controller';

@Module({
  controllers: [NsfpPoolController],
  providers: [NsfpPoolService],
  exports: [NsfpPoolService],
})
export class NsfpPoolModule {}
