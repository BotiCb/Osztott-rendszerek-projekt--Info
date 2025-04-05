// src/app.module.ts

import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SzavazoRendszerMongooseModule } from './shared/modules/szavazo-rendszer-mongoose-module/szavazo-rendszer-mongoose.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './shared/entities/users.entity';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres-server-45.postgres.database.azure.com', 
      port: 5432,
      username: 'postgres',
      password: 'szavazo1?',
      database: 'postgres',
      ssl: true,  
      entities: [User], 
      synchronize: true, 
      migrations: [
        'src/migrations/*.ts', // Define migration location
      ],
      // cli: {
      //   migrationsDir: 'src/migrations', // Specify migration folder
      // },
    }),
    // Globális mongoose kapcsolat
    // SzavazoRendszerMongooseModule,
    // Form funkciók
    // FormModule,
    // Form funkciók
    UserModule
  ],
})
export class AppModule {}
