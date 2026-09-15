import { pool, withTransaction, queryOne, query } from '../../db/client';
import { RegisterInput } from './auth.validation';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  AuthTokenPayload,
} from '../../utils/tokens';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/errors';
import { env } from '../../config/env';
import { usersService } from '../users/users.service';

export interface UserRecord {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  skills?: string[];
  interests?: string[];
  project_interests?: string[];
}

export class AuthService {
  async register(
    input: RegisterInput,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: UserRecord; accessToken: string; refreshToken: string }> {
    // Check if email or username is already taken
    const existing = await queryOne<UserRecord>(
      `SELECT id, email, username FROM users WHERE email = $1 OR username = $2`,
      [input.email, input.username]
    );

    if (existing) {
      if (existing.email === input.email) {
        throw new ConflictError('Email is already registered');
      }
      throw new ConflictError('Username is already taken');
    }

    const passwordHash = await hashPassword(input.password);

    // Create user and credentials inside a transaction
    const user = await withTransaction(async (client) => {
      const userRes = await client.query<UserRecord>(
        `INSERT INTO users (name, username, email)
         VALUES ($1, $2, $3)
         RETURNING id, name, username, email, bio, location, avatar_url, created_at, updated_at`,
        [input.name, input.username, input.email]
      );
      const newUser = userRes.rows[0];

      await client.query(
        `INSERT INTO credentials (user_id, password_hash) VALUES ($1, $2)`,
        [newUser.id, passwordHash]
      );

      return newUser;
    });

    // Create tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, userAgent ?? null, ipAddress ?? null]
    );

    return {
      user: {
        ...user,
        skills: [],
        interests: [],
        project_interests: [],
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async login(
    identifier: string,
    password: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: UserRecord; accessToken: string; refreshToken: string }> {
    const cleanId = identifier.trim().toLowerCase();

    // Query user and credentials
    const row = await queryOne<UserRecord & { password_hash: string }>(
      `SELECT u.id, u.name, u.username, u.email, u.bio, u.location, u.avatar_url,
              u.created_at, u.updated_at, c.password_hash
       FROM users u
       JOIN credentials c ON c.user_id = u.id
       WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1)
         AND u.deleted_at IS NULL`,
      [cleanId]
    );

    if (!row) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    const isMatch = await comparePassword(password, row.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email/username or password');
    }

    const { password_hash: _, ...user } = row;

    const [skills, interests, projectInterests] = await Promise.all([
      this.getUserSkills(user.id),
      this.getUserInterests(user.id),
      this.getUserProjectInterests(user.id),
    ]);

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: 'user',
    });

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, userAgent ?? null, ipAddress ?? null]
    );

    return {
      user: {
        ...user,
        skills,
        interests,
        project_interests: projectInterests,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  async refresh(
    rawRefreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hashed = hashToken(rawRefreshToken);

    const tokenRow = await queryOne<{ id: string; user_id: string; email: string }>(
      `SELECT rt.id, rt.user_id, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()
         AND u.deleted_at IS NULL`,
      [hashed]
    );

    if (!tokenRow) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Token rotation: revoke the old token
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [tokenRow.id]);

    // Issue new pair
    const accessToken = generateAccessToken({
      userId: tokenRow.user_id,
      email: tokenRow.email,
      role: 'user',
    });

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenRow.user_id, newTokenHash, expiresAt, userAgent ?? null, ipAddress ?? null]
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const hashed = hashToken(rawRefreshToken);
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, [hashed]);
  }

  async getCurrentUser(userId: string): Promise<UserRecord> {
    const user = await queryOne<UserRecord>(
      `SELECT id, name, username, email, bio, location, avatar_url, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const [skills, interests, projectInterests] = await Promise.all([
      this.getUserSkills(user.id),
      this.getUserInterests(user.id),
      this.getUserProjectInterests(user.id),
    ]);

    return {
      ...user,
      skills,
      interests,
      project_interests: projectInterests,
    };
  }

  async oauthLoginOrRegister(
    profile: {
      email: string;
      name: string;
      username?: string;
      avatarUrl?: string | null;
      provider?: string;
      providerUid?: string;
    },
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: UserRecord; accessToken: string; refreshToken: string }> {
    const cleanEmail = profile.email.toLowerCase().trim();
    const cleanName = profile.name?.trim() || cleanEmail.split('@')[0] || 'User';
    let baseUsername =
      profile.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24) ||
      cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 24) ||
      'creator';

    // 1. Check if user with this email already exists
    let user = await queryOne<UserRecord>(
      `SELECT id, name, username, email, bio, location, avatar_url, created_at, updated_at
       FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [cleanEmail]
    );

    if (user) {
      if (!user.avatar_url && profile.avatarUrl) {
        await query(`UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2`, [
          profile.avatarUrl,
          user.id,
        ]);
        user.avatar_url = profile.avatarUrl;
      }
    } else {
      const existingUserWithUsername = await queryOne<{ id: string }>(
        `SELECT id FROM users WHERE username = $1`,
        [baseUsername]
      );
      if (existingUserWithUsername) {
        baseUsername = `${baseUsername.slice(0, 20)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await queryOne<UserRecord>(
        `INSERT INTO users (name, username, email, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, username, email, bio, location, avatar_url, created_at, updated_at`,
        [cleanName, baseUsername, cleanEmail, profile.avatarUrl || null]
      );
    }

    const payload: AuthTokenPayload = {
      userId: user!.id,
      email: user!.email,
      role: 'member',
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user!.id, tokenHash, expiresAt, userAgent, ipAddress]
    );

    const fullProfile = await usersService.getProfile(user!.id);
    return { user: fullProfile, accessToken, refreshToken };
  }

  private async getUserSkills(userId: string): Promise<string[]> {
    const rows = await query<{ skill: string }>(
      `SELECT skill FROM user_skills WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.skill);
  }

  private async getUserInterests(userId: string): Promise<string[]> {
    const rows = await query<{ interest: string }>(
      `SELECT interest FROM user_interests WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.interest);
  }

  private async getUserProjectInterests(userId: string): Promise<string[]> {
    const rows = await query<{ topic: string }>(
      `SELECT topic FROM user_project_interests WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return rows.map((r) => r.topic);
  }
}

export const authService = new AuthService();
