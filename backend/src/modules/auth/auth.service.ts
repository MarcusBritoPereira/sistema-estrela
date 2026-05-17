import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';

interface AuthUserConfig {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tokenType?: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  private readonly users: AuthUserConfig[];

  constructor(
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {
    this.users = this.loadUsers();
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.issueTokens(user);

    await this.auditService.record({
      action: 'auth.login.success',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      metadata: { source: 'auth.login' },
    });

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.getRequiredEnv('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Refresh token inválido.');
      }

      const user = this.users.find((item) => item.id === payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      const tokens = await this.issueTokens(user);
      await this.auditService.record({
        action: 'auth.refresh.success',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        metadata: { source: 'auth.refresh' },
      });

      return {
        ...tokens,
        user: this.toPublicUser(user),
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  private async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUserConfig> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find(
      (item) => item.email.toLowerCase() === normalizedEmail,
    );

    if (!user) {
      await this.auditService.record({
        action: 'auth.login.failure',
        userEmail: normalizedEmail,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      await this.auditService.record({
        action: 'auth.login.failure',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        metadata: { reason: 'invalid_password' },
      });
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return user;
  }

  private async issueTokens(user: AuthUserConfig) {
    const payload: Omit<JwtPayload, 'tokenType'> = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessOptions: JwtSignOptions = {
      secret: this.getRequiredEnv('JWT_ACCESS_SECRET'),
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ||
        '15m') as JwtSignOptions['expiresIn'],
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.getRequiredEnv('JWT_REFRESH_SECRET'),
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ||
        '7d') as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, tokenType: 'access' as const },
        accessOptions,
      ),
      this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' as const },
        refreshOptions,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private loadUsers(): AuthUserConfig[] {
    const configuredUsers = process.env.AUTH_USERS_JSON;
    if (configuredUsers) {
      const parsed = JSON.parse(configuredUsers) as AuthUserConfig[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AUTH_USERS_JSON must be a non-empty JSON array.');
      }
      return parsed.map((user) => this.normalizeUserConfig(user));
    }

    const bootstrapEmail = process.env.AUTH_BOOTSTRAP_EMAIL;
    const bootstrapPasswordHash = process.env.AUTH_BOOTSTRAP_PASSWORD_HASH;

    if (bootstrapEmail && bootstrapPasswordHash) {
      return [
        this.normalizeUserConfig({
          id: process.env.AUTH_BOOTSTRAP_ID || 'bootstrap-admin',
          email: bootstrapEmail,
          name: process.env.AUTH_BOOTSTRAP_NAME || 'Administrador',
          role: (process.env.AUTH_BOOTSTRAP_ROLE as UserRole) || 'ADMIN',
          passwordHash: bootstrapPasswordHash,
        }),
      ];
    }

    throw new Error(
      'No authentication users configured. Set AUTH_USERS_JSON or AUTH_BOOTSTRAP_EMAIL/AUTH_BOOTSTRAP_PASSWORD_HASH.',
    );
  }

  private normalizeUserConfig(user: AuthUserConfig): AuthUserConfig {
    if (
      !user.id ||
      !user.email ||
      !user.name ||
      !user.role ||
      !user.passwordHash
    ) {
      throw new Error(
        'Invalid auth user configuration. id, email, name, role and passwordHash are required.',
      );
    }

    return {
      ...user,
      email: user.email.trim().toLowerCase(),
      role: user.role,
    };
  }

  private toPublicUser(user: AuthUserConfig) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }
}
