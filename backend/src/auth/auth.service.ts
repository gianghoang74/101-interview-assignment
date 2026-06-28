import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicUser {
  id: string;
  email: string;
  fullname: string;
  createdAt: string; // ISO-8601; matches the JSON wire value and UserProfileDto
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Returns the user when credentials are valid, otherwise throws 401. */
  async validateUser(email: string, password: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return AuthService.toPublic(user);
  }

  issueToken(user: PublicUser): string {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return AuthService.toPublic(user);
  }

  private static toPublic(user: {
    id: string;
    email: string;
    fullname: string;
    createdAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
