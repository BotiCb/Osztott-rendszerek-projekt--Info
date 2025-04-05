// src/app.module.ts

import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SzavazoRendszerMongooseModule } from './shared/modules/szavazo-rendszer-mongoose-module/szavazo-rendszer-mongoose.module';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [
    // Globális mongoose kapcsolat
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres-server-45.postgres.database.azure.com', // or your remote IP
      port: 5432,
      username: 'postgres',
      password: 'szavazo1?',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: true, // DON'T use in prod
    }),
    SzavazoRendszerMongooseModule,
    // Form funkciók
    FormModule,
  ],
})
export class AppModule {}
