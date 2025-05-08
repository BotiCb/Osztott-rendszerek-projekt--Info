import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  /** Returns true if this user has already cast a vote */
  async hasVoted(userId: number): Promise<boolean> {
    const existing = await this.votingRepo.findOne({
      where: { user: { id: userId } },
    });
    return !!existing;
  }

  /** Create a new vote, preventing double-voting */
  async create(userId: number, voteValue: number): Promise<Voting> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      console.log(`User ${userId} not found`);
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (await this.hasVoted(userId)) {
      console.log(`User ${userId} attempted to vote again`);
      throw new ConflictException('You have already voted.');
    }

    const vote = this.votingRepo.create({ user, vote_value: voteValue });
    console.log(`Saving vote for user ${userId}:`, voteValue);
    return this.votingRepo.save(vote);
  }

  /** Get all votes, including user info */
  async findAll(): Promise<Voting[]> {
    return this.votingRepo.find({ relations: ['user'] });
  }

  /** Count votes grouped by vote_value */
  async getVoteCounts(): Promise<Record<number, number>> {
    const raw = await this.votingRepo
      .createQueryBuilder('v')
      .select('v.vote_value', 'vote_value')
      .addSelect('COUNT(*)', 'count')
      .groupBy('v.vote_value')
      .getRawMany<{ vote_value: number; count: string }>();

    return raw.reduce(
      (acc, { vote_value, count }) => {
        acc[vote_value] = parseInt(count, 10);
        return acc;
      },
      {} as Record<number, number>
    );
  }

  /** Get votes by a specific user */
  async findVotesByUser(userId: number): Promise<Voting[]> {
    return this.votingRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /** Get the most recent vote */
  async findMostRecentVote(): Promise<Voting> {
    const [latest] = await this.votingRepo.find({
      order: { voted_at: 'DESC' },
      take: 1,
    });
    return latest;
  }
}
