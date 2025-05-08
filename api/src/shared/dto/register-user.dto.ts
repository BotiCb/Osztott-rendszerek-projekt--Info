import { IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString() username: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() fullname: string;
}
