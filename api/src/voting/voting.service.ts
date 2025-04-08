import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Voting } from 'src/shared/entities/voting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Voting)
    private votingRepository: Repository<Voting>
  ) {}

  // Get all votes
  async findAll(): Promise<Voting[]> {
    return this.votingRepository.find({
      relations: ['user'], // Includes user data with each vote
    });
  }

  // Get votes by specific user
  async findVotesByUser(userId: number): Promise<Voting[]> {
    return this.votingRepository.find({
      where: { user: { id: userId } }, // Filters by user_id
      relations: ['user'], // Optionally include user data
    });
  }

  // Get the total count of positive votes (1) and negative votes (-1)
  async getVoteCounts(): Promise<{ positiveVotes: number; negativeVotes: number }> {
    const positiveVotes = await this.votingRepository.count({
      where: { vote_value: 1 },
    });
    const negativeVotes = await this.votingRepository.count({
      where: { vote_value: -1 },
    });

    return {
      positiveVotes,
      negativeVotes,
    };
  }

  // Get the most recent vote
  async findMostRecentVote(): Promise<Voting> {
    const votes = await this.votingRepository.find({
      order: { voted_at: 'DESC' },
      take: 1, // Limit the result to 1
    });
    return votes[0];
  }
}
