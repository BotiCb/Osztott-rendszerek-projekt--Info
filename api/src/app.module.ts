// src/app.module.ts

import { Module } from '@nestjs/common';
import { FormModule } from './form/form.module';
import { SzavazoRendszerMongooseModule } from './shared/modules/szavazo-rendszer-mongoose-module/szavazo-rendszer-mongoose.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './shared/entities/users.entity';
import { Voting } from './shared/entities/voting.entity';
import { VotingModule } from './voting/voting.module';
 
@Module({
  imports: [
    // Postgresql rész
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres-server-45.postgres.database.azure.com',
      port: 5432,
      username: 'postgres',
      password: 'szavazo1?',
      database: 'postgres',
      ssl: true,
      entities: [User, Voting],
      synchronize: false,
    }),
    UserModule,
    VotingModule,
    // Globális mongoose kapcsolat
    SzavazoRendszerMongooseModule,
    // Form funkciók
    FormModule,
    // Form funkciók
  ],
})
export class AppModule {}
