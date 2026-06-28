import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { AuthService, type PublicUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UserProfileDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and receive a JWT access token' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const accessToken = this.auth.issueToken(user);
    return { accessToken, user };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the current authenticated user' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token' })
  me(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.auth.getProfile(user.id);
  }
}
