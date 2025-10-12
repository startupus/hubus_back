/**
 * Authentication DTOs
 */
import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsNotEmpty, IsArray, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password', minLength: 8, maxLength: 128 })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;

  @ApiProperty({ example: 'John', description: 'User first name', required: false })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @ApiProperty({ example: 'Doe', description: 'User last name', required: false })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString({ message: 'Password must be a string' })
  password!: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}

export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
}

export class ResetPasswordRequestDto {
  email!: string;
}

export class ResetPasswordDto {
  token!: string;
  newPassword!: string;
}

export class VerifyEmailDto {
  token!: string;
}

export class CreateApiKeyDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Permissions must be an array' })
  @IsString({ each: true, message: 'Each permission must be a string' })
  permissions?: string[];

  @IsOptional()
  @IsString({ message: 'ExpiresAt must be a string' })
  @IsISO8601({}, { message: 'ExpiresAt must be a valid ISO 8601 date' })
  expiresAt?: string;
}

export class UpdateApiKeyDto {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  tokenType: string = 'Bearer';
  expiresIn!: number;
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

export class ApiKeyResponseDto {
  id!: string;
  key!: string;
  name!: string;
  description?: string;
  isActive!: boolean;
  permissions!: string[];
  createdAt!: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export class UserProfileDto {
  id!: string;
  email!: string;
  role!: string;
  isActive!: boolean;
  isVerified!: boolean;
  createdAt!: string;
  updatedAt!: string;
  lastLoginAt?: string;
}