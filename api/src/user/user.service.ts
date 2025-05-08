import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from 'src/shared/dto/register-user.dto';
import { User } from 'src/shared/entities/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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

  async register(dto: RegisterUserDto): Promise<User> {
    // Check duplicate email or username
    if (await this.userRepo.findOneBy({ email: dto.email })) {
      throw new ConflictException('Email already registered');
    }
    if (await this.userRepo.findOneBy({ username: dto.username })) {
      throw new ConflictException('Username already taken');
    }

    // Hash password (if still storing it)
    // const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      user_password: dto.password,
      fullname: dto.fullname,
    });
    return this.userRepo.save(user);
  }
}
