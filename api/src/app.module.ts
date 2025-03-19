// src/app.module.ts

import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SzavazoRendszerMongooseModule } from './shared/modules/szavazo-rendszer-mongoose-module/szavazo-rendszer-mongoose.module';

@Module({
  imports: [
    // Globális mongoose kapcsolat
    SzavazoRendszerMongooseModule,
    // Form funkciók
    FormModule,
  ],
})
export class AppModule {}
