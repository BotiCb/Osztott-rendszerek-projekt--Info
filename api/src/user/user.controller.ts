import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/shared/entities/users.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Get all users
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.userService.getUsers();
  }

  // Get a user by ID
  @Get(':id')
  async getUserById(@Param('id') id: number): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Get('username/:username')
  async getUserByUsername(@Param('username') username: string): Promise<User> {
    return this.userService.getUserByUsername(username);
  }
}
