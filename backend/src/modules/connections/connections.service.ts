import { query, queryOne, withTransaction } from '../../db/client';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../utils/errors';
import { UserRecord } from '../auth/auth.service';

export interface ConnectionRecord {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
  partner?: UserRecord;
}

export class ConnectionsService {
  async getConnections(userId: string): Promise<ConnectionRecord[]> {
    const rows = await query<ConnectionRecord & {
      partner_id: string;
      partner_name: string;
      partner_username: string;
      partner_bio: string;
      partner_location: string;
      partner_avatar_url: string | null;
      partner_created_at: string;
      partner_updated_at: string;
    }>(
      `SELECT c.id, c.requester_id, c.addressee_id, c.status, c.created_at, c.updated_at,
              u.id as partner_id, u.name as partner_name, u.username as partner_username,
              u.bio as partner_bio, u.location as partner_location,
              u.avatar_url as partner_avatar_url, u.created_at as partner_created_at,
              u.updated_at as partner_updated_at
       FROM connections c
       JOIN users u ON u.id = CASE WHEN c.requester_id = $1 THEN c.addressee_id ELSE c.requester_id END
       WHERE (c.requester_id = $1 OR c.addressee_id = $1)
       ORDER BY c.updated_at DESC`,
      [userId]
    );

    return rows.map((r) => ({
      id: r.id,
      requester_id: r.requester_id,
      addressee_id: r.addressee_id,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      partner: {
        id: r.partner_id,
        name: r.partner_name,
        username: r.partner_username,
        email: '',
        bio: r.partner_bio,
        location: r.partner_location,
        avatar_url: r.partner_avatar_url,
        created_at: r.partner_created_at,
        updated_at: r.partner_updated_at,
      },
    }));
  }

  async sendRequest(requesterId: string, addresseeId: string): Promise<ConnectionRecord> {
    if (requesterId === addresseeId) {
      throw new BadRequestError('Cannot send connection request to yourself');
    }

    const targetUser = await queryOne<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [addresseeId]
    );
    if (!targetUser) {
      throw new NotFoundError('Target user does not exist');
    }

    const existing = await queryOne<ConnectionRecord>(
      `SELECT id, requester_id, addressee_id, status FROM connections
       WHERE (requester_id = $1 AND addressee_id = $2)
          OR (requester_id = $2 AND addressee_id = $1)`,
      [requesterId, addresseeId]
    );

    if (existing) {
      if (existing.status === 'accepted') {
        throw new ConflictError('You are already connected with this user');
      }
      if (existing.status === 'pending') {
        throw new ConflictError('A pending connection request already exists');
      }

      // If previously declined or cancelled, allow re-requesting by updating the record
      const updated = await queryOne<ConnectionRecord>(
        `UPDATE connections
         SET requester_id = $1, addressee_id = $2, status = 'pending', updated_at = NOW()
         WHERE id = $3
         RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
        [requesterId, addresseeId, existing.id]
      );
      return updated!;
    }

    const created = await queryOne<ConnectionRecord>(
      `INSERT INTO connections (requester_id, addressee_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
      [requesterId, addresseeId]
    );

    return created!;
  }

  async acceptRequest(connectionId: string, userId: string): Promise<ConnectionRecord> {
    const connection = await queryOne<ConnectionRecord>(
      `SELECT id, requester_id, addressee_id, status FROM connections WHERE id = $1`,
      [connectionId]
    );

    if (!connection) {
      throw new NotFoundError('Connection request not found');
    }

    if (connection.addressee_id !== userId) {
      throw new ForbiddenError('Only the recipient can accept this connection request');
    }

    if (connection.status !== 'pending') {
      throw new BadRequestError(`Cannot accept a connection in status "${connection.status}"`);
    }

    return withTransaction(async (client) => {
      const updated = await client.query<ConnectionRecord>(
        `UPDATE connections SET status = 'accepted', updated_at = NOW()
         WHERE id = $1
         RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
        [connectionId]
      );

      // Create activity records
      await client.query(
        `INSERT INTO activity (user_id, kind, title, description, reference_id)
         VALUES ($1, 'connection', 'Connected with a collaborator', '', $2)`,
        [userId, connection.requester_id]
      );
      await client.query(
        `INSERT INTO activity (user_id, kind, title, description, reference_id)
         VALUES ($1, 'connection', 'Connected with a collaborator', '', $2)`,
        [connection.requester_id, userId]
      );

      return updated.rows[0];
    });
  }

  async declineRequest(connectionId: string, userId: string): Promise<ConnectionRecord> {
    const connection = await queryOne<ConnectionRecord>(
      `SELECT id, requester_id, addressee_id, status FROM connections WHERE id = $1`,
      [connectionId]
    );

    if (!connection) {
      throw new NotFoundError('Connection request not found');
    }

    if (connection.addressee_id !== userId) {
      throw new ForbiddenError('Only the recipient can decline this connection request');
    }

    if (connection.status !== 'pending') {
      throw new BadRequestError(`Cannot decline a connection in status "${connection.status}"`);
    }

    const updated = await queryOne<ConnectionRecord>(
      `UPDATE connections SET status = 'declined', updated_at = NOW()
       WHERE id = $1
       RETURNING id, requester_id, addressee_id, status, created_at, updated_at`,
      [connectionId]
    );

    return updated!;
  }

  async removeConnection(connectionId: string, userId: string): Promise<void> {
    const connection = await queryOne<ConnectionRecord>(
      `SELECT id, requester_id, addressee_id, status FROM connections WHERE id = $1`,
      [connectionId]
    );

    if (!connection) {
      throw new NotFoundError('Connection not found');
    }

    if (connection.requester_id !== userId && connection.addressee_id !== userId) {
      throw new ForbiddenError('You are not a participant in this connection');
    }

    await query(`DELETE FROM connections WHERE id = $1`, [connectionId]);
  }
}

export const connectionsService = new ConnectionsService();
