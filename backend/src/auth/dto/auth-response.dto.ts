import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'demo@simpleinvoice.test' })
  email!: string;

  @ApiProperty({ example: 'Demo User' })
  fullname!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-06-03T12:03:26.995Z',
    description: 'ISO-8601 timestamp (serialized as a string)',
  })
  createdAt!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token — send as `Authorization: Bearer <token>`',
  })
  accessToken!: string;

  @ApiProperty({ type: UserProfileDto })
  user!: UserProfileDto;
}
