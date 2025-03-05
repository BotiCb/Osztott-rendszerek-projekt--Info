import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'src/shared/config/config';

@Module({
  imports: [
    MongooseModule.forRoot(config.get('db.url')),
    // MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema, collection: 'User' }]),
  ],
  exports: [
    MongooseModule.forRoot(config.get('db.url')),
    // MongooseModule.forFeature([{ name: UserModel.name, schema: UserSchema, collection: 'User' }]),
  ],
})
export class SzavazoRendszerMongooseModule {}
