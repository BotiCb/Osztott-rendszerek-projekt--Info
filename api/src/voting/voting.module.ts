import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingService } from './voting.service';
import { VotingController } from './voting.controller';
import { Voting } from 'src/shared/entities/voting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Voting])],
  providers: [VotingService],
  controllers: [VotingController],
})
export class VotingModule {}
