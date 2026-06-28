import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'demo@simpleinvoice.test',
    description: 'Account email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
