// src/voting/dto/create-vote.dto.ts
import { IsInt, Min, Max } from 'class-validator';

export class CreateVoteDto {
  @IsInt()
  userId: number;

  @IsInt()
  @Min(-1)
  @Max(1)
  voteValue: number;
}
