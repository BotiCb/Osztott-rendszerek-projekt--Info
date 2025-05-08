// src/voting/voting.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { VotingService } from './voting.service';
import { Voting } from 'src/shared/entities/voting.entity';
import { CreateVoteDto } from './dto/create-vote.dto';

@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Get()
  getAllVotes(): Promise<Voting[]> {
    return this.votingService.findAll();
  }

  @Get('user/:userId')
  getVotesByUser(@Param('userId') userId: number): Promise<Voting[]> {
    return this.votingService.findVotesByUser(userId);
  }

  @Get('vote-counts')
  getVoteCounts(): Promise<{ positiveVotes: number; negativeVotes: number }> {
    return this.votingService.getVoteCounts();
  }

  @Get('most-recent')
  getMostRecentVote(): Promise<Voting> {
    return this.votingService.findMostRecentVote();
  }

  // New endpoint to cast a vote
  @Post()
  createVote(@Body() dto: CreateVoteDto): Promise<Voting> {
    return this.votingService.create(dto.userId, dto.voteValue);
  }
}
