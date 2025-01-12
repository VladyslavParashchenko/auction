import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bid, BidSchema } from '#app-root/bids/schemas/bid.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Bid.name, schema: BidSchema }])],
})
export class BidsModule {}
