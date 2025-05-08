// src/voting/voting.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voting } from 'src/shared/entities/voting.entity';
import { User } from 'src/shared/entities/users.entity';
import { VotingService } from './voting.service';
import { VotingController } from './voting.controller';
import { VotingGateway } from './voting.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Voting, User])],
  providers: [VotingService, VotingGateway],
  controllers: [VotingController],
})
export class VotingModule {}
