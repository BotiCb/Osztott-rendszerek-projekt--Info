import { Module } from '@nestjs/common';
import { SzavazoRendszerMongooseModule } from './modules/szavazo-rendszer-mongoose-module/szavazo-rendszer-mongoose.module';

@Module({
  imports: [SzavazoRendszerMongooseModule],
  exports: [SzavazoRendszerMongooseModule],
})
export class SharedModule {}
