import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from 'src/shared/entities/users.entity';
import { RegisterUserDto } from 'src/shared/dto/register-user.dto';

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

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<User> {
    return this.userService.register(dto);
  }
}
