// src/voting/voting.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Voting } from 'src/shared/entities/voting.entity';
import { Repository } from 'typeorm';
import { User } from 'src/shared/entities/users.entity';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Voting)
    private readonly votingRepo: Repository<Voting>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async hasVoted(userId: number): Promise<boolean> {
    const existing = await this.votingRepo.findOne({
      where: { user: { id: userId } },
    });
    return !!existing;
  }
  async findAll(): Promise<Voting[]> {
    return this.votingRepo.find({ relations: ['user'] });
  }

  async findVotesByUser(userId: number): Promise<Voting[]> {
    return this.votingRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async getVoteCounts(): Promise<{ positiveVotes: number; negativeVotes: number }> {
    const positiveVotes = await this.votingRepo.count({ where: { vote_value: 1 } });
    const negativeVotes = await this.votingRepo.count({ where: { vote_value: -1 } });
    return { positiveVotes, negativeVotes };
  }

  async findMostRecentVote(): Promise<Voting> {
    const [latest] = await this.votingRepo.find({
      order: { voted_at: 'DESC' },
      take: 1,
    });
    return latest;
  }

  async deleteAll(): Promise<void> {
    await this.votingRepo.delete({});
  }

  // New: create a vote
  // src/voting/voting.service.ts
  async create(userId: number, voteValue: number): Promise<Voting> {
    // ← use findOneBy, not findOne(id)
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // Prevent double‐voting
    const existing = await this.votingRepo.findOne({
      where: { user: { id: userId } },
    });
    if (existing) {
      console.log(`User ${userId} attempted to vote again`);
      throw new ConflictException('You have already voted.');
    }

    const vote = this.votingRepo.create({
      user,
      vote_value: voteValue,
    });
    return this.votingRepo.save(vote);
  }
}
