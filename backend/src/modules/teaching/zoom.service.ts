import { env } from '../../config/env';
import { query, queryOne } from '../../db/client';
import { BadRequestError, NotFoundError } from '../../utils/errors';

export interface ZoomStatusResult {
  connected: boolean;
  configured: boolean;
  zoomEmail?: string | null;
  zoomUserId?: string | null;
  connectedAt?: string | null;
  message?: string;
}

interface ZoomTokenRow {
  user_id: string;
  zoom_user_id: string | null;
  zoom_email: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string | null;
  connected_at: string;
  updated_at: string;
}

export class ZoomService {
  isConfigured(): boolean {
    return Boolean(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET);
  }

  private getRedirectUri(): string {
    if (env.ZOOM_REDIRECT_URI) return env.ZOOM_REDIRECT_URI;
    // Default to canonical Render backend callback URL in production
    const isProd = env.NODE_ENV === 'production';
    return isProd
      ? 'https://skill-swap-api-0jym.onrender.com/api/v1/teaching/zoom/callback'
      : `http://localhost:${env.PORT}/api/v1/teaching/zoom/callback`;
  }

  async getZoomStatus(userId: string): Promise<ZoomStatusResult> {
    const configured = this.isConfigured();
    const row = await queryOne<ZoomTokenRow>(
      `SELECT * FROM user_zoom_integrations WHERE user_id = $1`,
      [userId]
    );

    if (!row) {
      return {
        connected: false,
        configured,
        message: configured
          ? 'Zoom is not connected. Connect your account to auto-generate meetings.'
          : 'Zoom server integration credentials are not configured.',
      };
    }

    // Check expiration, refresh if expired
    const expiresAt = new Date(row.expires_at).getTime();
    if (Date.now() >= expiresAt - 300_000) {
      try {
        await this.refreshAccessToken(userId, row.refresh_token);
        const refreshed = await queryOne<ZoomTokenRow>(
          `SELECT * FROM user_zoom_integrations WHERE user_id = $1`,
          [userId]
        );
        return {
          connected: true,
          configured,
          zoomEmail: refreshed?.zoom_email,
          zoomUserId: refreshed?.zoom_user_id,
          connectedAt: refreshed?.connected_at,
        };
      } catch (err: any) {
        return {
          connected: false,
          configured,
          message: 'Zoom token expired and re-authorization is required.',
        };
      }
    }

    return {
      connected: true,
      configured,
      zoomEmail: row.zoom_email,
      zoomUserId: row.zoom_user_id,
      connectedAt: row.connected_at,
    };
  }

  getAuthorizeUrl(userId: string): string {
    if (!this.isConfigured()) {
      throw new BadRequestError(
        'Zoom integration is not configured on the server. ZOOM_CLIENT_ID and ZOOM_CLIENT_SECRET are required.'
      );
    }

    const statePayload = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() })
    ).toString('base64url');

    const redirectUri = this.getRedirectUri();
    const url = new URL('https://zoom.us/oauth/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', env.ZOOM_CLIENT_ID!);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', statePayload);

    return url.toString();
  }

  async handleCallback(code: string, state: string): Promise<{ userId: string; email: string }> {
    if (!this.isConfigured()) {
      throw new BadRequestError('Zoom integration credentials are not configured on the server.');
    }

    let userId: string;
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      userId = decoded.userId;
      if (!userId) throw new Error('Missing userId in state');
    } catch {
      throw new BadRequestError('Invalid or corrupted OAuth state parameter.');
    }

    const redirectUri = this.getRedirectUri();
    const basicAuth = Buffer.from(
      `${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirectUri);

    const tokenRes = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new BadRequestError(
        `Failed to exchange Zoom authorization code: ${tokenData.error_description || tokenData.reason || tokenRes.statusText}`
      );
    }

    const userProfileRes = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userProfile = (await userProfileRes.json()) as any;

    const zoomUserId = userProfile.id || null;
    const zoomEmail = userProfile.email || null;
    const expiresInSeconds = Number(tokenData.expires_in) || 3600;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    await query(
      `INSERT INTO user_zoom_integrations (
         user_id, zoom_user_id, zoom_email, access_token, refresh_token, expires_at, scope, connected_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         zoom_user_id = EXCLUDED.zoom_user_id,
         zoom_email = EXCLUDED.zoom_email,
         access_token = EXCLUDED.access_token,
         refresh_token = EXCLUDED.refresh_token,
         expires_at = EXCLUDED.expires_at,
         scope = EXCLUDED.scope,
         updated_at = NOW()`,
      [
        userId,
        zoomUserId,
        zoomEmail,
        tokenData.access_token,
        tokenData.refresh_token,
        expiresAt,
        tokenData.scope || null,
      ]
    );

    return { userId, email: zoomEmail || '' };
  }

  async disconnect(userId: string): Promise<void> {
    await query(`DELETE FROM user_zoom_integrations WHERE user_id = $1`, [userId]);
  }

  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const basicAuth = Buffer.from(
      `${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`
    ).toString('base64');

    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refreshToken);

    const res = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data.access_token) {
      throw new BadRequestError('Failed to refresh Zoom token. Re-authorization required.');
    }

    const expiresInSeconds = Number(data.expires_in) || 3600;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    await query(
      `UPDATE user_zoom_integrations
       SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [data.access_token, data.refresh_token || refreshToken, expiresAt, userId]
    );

    return data.access_token;
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const row = await queryOne<ZoomTokenRow>(
      `SELECT * FROM user_zoom_integrations WHERE user_id = $1`,
      [userId]
    );
    if (!row) {
      throw new BadRequestError(
        'Zoom is not connected. Please connect your Zoom account to auto-generate meetings.'
      );
    }

    const expiresAt = new Date(row.expires_at).getTime();
    if (Date.now() >= expiresAt - 300_000) {
      return this.refreshAccessToken(userId, row.refresh_token);
    }

    return row.access_token;
  }

  async createMeeting(
    userId: string,
    options: {
      topic: string;
      scheduledAt: string;
      durationMinutes: number;
      timezone?: string;
    }
  ): Promise<{ meetingId: string; meetingUrl: string; password?: string }> {
    const accessToken = await this.getValidAccessToken(userId);

    const payload = {
      topic: options.topic,
      type: 2, // Scheduled meeting
      start_time: new Date(options.scheduledAt).toISOString(),
      duration: options.durationMinutes,
      timezone: options.timezone || 'UTC',
      settings: {
        join_before_host: false,
        participant_video: true,
        host_video: true,
        waiting_room: true,
        auto_recording: 'none',
      },
    };

    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;
    if (!res.ok || !data.join_url) {
      throw new BadRequestError(
        `Unable to create Zoom meeting: ${data.message || data.error || res.statusText}`
      );
    }

    return {
      meetingId: String(data.id),
      meetingUrl: data.join_url,
      password: data.password || undefined,
    };
  }

  async updateMeeting(
    userId: string,
    meetingId: string,
    options: {
      topic?: string;
      scheduledAt?: string;
      durationMinutes?: number;
      timezone?: string;
    }
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);

    const payload: Record<string, any> = {};
    if (options.topic) payload.topic = options.topic;
    if (options.scheduledAt) payload.start_time = new Date(options.scheduledAt).toISOString();
    if (options.durationMinutes) payload.duration = options.durationMinutes;
    if (options.timezone) payload.timezone = options.timezone;

    const res = await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok && res.status !== 204) {
      const data = ((await res.json().catch(() => ({}))) as any);
      throw new BadRequestError(
        `Unable to update Zoom meeting: ${data.message || res.statusText}`
      );
    }
  }

  async deleteMeeting(userId: string, meetingId: string): Promise<void> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      await fetch(`https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (err) {
      // Log and continue if meeting was already cancelled or removed
      console.warn('Notice: Failed to delete Zoom meeting from Zoom API:', err);
    }
  }
}

export const zoomService = new ZoomService();
