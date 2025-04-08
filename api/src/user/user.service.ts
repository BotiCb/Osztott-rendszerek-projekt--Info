import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  // Get all users
  async getUsers(): Promise<User[]> {
    return this.userRepo.find();
  }

  // Get user by ID
  async getUserById(id: number): Promise<User> {
    return this.userRepo.findOne({ where: { id } });
  }

  async getUserByUsername(username: string): Promise<User> {
    return this.userRepo.findOne({ where: { username } });
  }
}
