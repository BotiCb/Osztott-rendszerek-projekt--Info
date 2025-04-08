import { Controller, Get, Param } from '@nestjs/common';
import { VotingService } from './voting.service';
import { Voting } from 'src/shared/entities/voting.entity';

@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  // Get all votes
  @Get()
  async getAllVotes(): Promise<Voting[]> {
    return this.votingService.findAll();
  }

  // Get votes by user ID
  @Get('user/:userId')
  async getVotesByUser(@Param('userId') userId: number): Promise<Voting[]> {
    return this.votingService.findVotesByUser(userId);
  }

  // Get vote counts (positive vs negative votes)
  @Get('vote-counts')
  async getVoteCounts(): Promise<{ positiveVotes: number; negativeVotes: number }> {
    return this.votingService.getVoteCounts();
  }

  // Get the most recent vote
  @Get('most-recent')
  async getMostRecentVote(): Promise<Voting> {
    return this.votingService.findMostRecentVote();
  }
}
