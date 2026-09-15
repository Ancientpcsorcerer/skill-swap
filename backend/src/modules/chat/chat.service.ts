import { query, queryOne } from '../../db/client';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../utils/errors';

export interface ChatParticipantInfo {
  id: string;
  name: string;
  username: string;
  avatar_url?: string | null;
  bio?: string;
}

export interface ConversationSummary {
  id: string;
  partner: ChatParticipantInfo;
  updated_at: string;
  lastMessage?: {
    id: string;
    sender_id: string;
    ciphertext: string;
    iv: string;
    auth_tag: string;
    created_at: string;
  };
}

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
  ratchet_header?: Record<string, unknown> | null;
  created_at: string;
}

export class ChatService {
  async getOrCreateConversation(currentUserId: string, partnerId: string): Promise<ConversationSummary> {
    if (!partnerId || currentUserId === partnerId) {
      throw new BadRequestError('Cannot start a conversation with yourself or an invalid user');
    }

    // Check that partner exists in users table
    const partner = await queryOne<ChatParticipantInfo>(
      `SELECT id, name, username, avatar_url, bio FROM users WHERE id = $1`,
      [partnerId]
    );
    if (!partner) {
      throw new NotFoundError('Target user not found');
    }

    // Canonical pair ordering
    const [p1, p2] = currentUserId < partnerId ? [currentUserId, partnerId] : [partnerId, currentUserId];

    const row = await queryOne<{ id: string; updated_at: string }>(
      `INSERT INTO chat_conversations (participant_one_id, participant_two_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (participant_one_id, participant_two_id)
       DO UPDATE SET updated_at = chat_conversations.updated_at
       RETURNING id, updated_at`,
      [p1, p2]
    );

    return {
      id: row!.id,
      partner,
      updated_at: row!.updated_at,
    };
  }

  async getConversations(currentUserId: string): Promise<ConversationSummary[]> {
    const rows = await query<{
      id: string;
      updated_at: string;
      partner_id: string;
      partner_name: string;
      partner_username: string;
      partner_avatar_url: string | null;
      partner_bio: string;
      last_msg_id: string | null;
      last_msg_sender: string | null;
      last_msg_cipher: string | null;
      last_msg_iv: string | null;
      last_msg_tag: string | null;
      last_msg_created: string | null;
    }>(
      `SELECT c.id, c.updated_at,
              u.id as partner_id, u.name as partner_name, u.username as partner_username,
              u.avatar_url as partner_avatar_url, u.bio as partner_bio,
              m.id as last_msg_id, m.sender_id as last_msg_sender,
              m.ciphertext as last_msg_cipher, m.iv as last_msg_iv,
              m.auth_tag as last_msg_tag, m.created_at as last_msg_created
       FROM chat_conversations c
       JOIN users u ON u.id = CASE WHEN c.participant_one_id = $1 THEN c.participant_two_id ELSE c.participant_one_id END
       LEFT JOIN LATERAL (
         SELECT id, sender_id, ciphertext, iv, auth_tag, created_at
         FROM chat_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) m ON true
       WHERE (c.participant_one_id = $1 OR c.participant_two_id = $1)
       ORDER BY c.updated_at DESC`,
      [currentUserId]
    );

    return rows.map((r) => ({
      id: r.id,
      partner: {
        id: r.partner_id,
        name: r.partner_name,
        username: r.partner_username,
        avatar_url: r.partner_avatar_url,
        bio: r.partner_bio,
      },
      updated_at: r.updated_at,
      lastMessage: r.last_msg_id
        ? {
            id: r.last_msg_id,
            sender_id: r.last_msg_sender!,
            ciphertext: r.last_msg_cipher!,
            iv: r.last_msg_iv!,
            auth_tag: r.last_msg_tag!,
            created_at: r.last_msg_created!,
          }
        : undefined,
    }));
  }

  async getMessages(conversationId: string, currentUserId: string): Promise<ChatMessageRecord[]> {
    // Strictly verify membership (Bug H3)
    const conv = await queryOne<{ id: string; participant_one_id: string; participant_two_id: string }>(
      `SELECT id, participant_one_id, participant_two_id FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    if (conv.participant_one_id !== currentUserId && conv.participant_two_id !== currentUserId) {
      throw new ForbiddenError('You are not authorized to view messages in this conversation');
    }

    const messages = await query<ChatMessageRecord>(
      `SELECT id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, created_at
       FROM chat_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return messages;
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    ciphertext: string,
    iv: string,
    authTag: string,
    ratchetHeader?: Record<string, unknown>
  ): Promise<ChatMessageRecord> {
    if (!ciphertext || !iv || !authTag) {
      throw new BadRequestError('Encrypted payload requires ciphertext, iv, and authTag');
    }

    // Strictly verify sender is participant
    const conv = await queryOne<{ id: string; participant_one_id: string; participant_two_id: string }>(
      `SELECT id, participant_one_id, participant_two_id FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    if (conv.participant_one_id !== senderId && conv.participant_two_id !== senderId) {
      throw new ForbiddenError('You are not authorized to send messages in this conversation');
    }

    const msg = await queryOne<ChatMessageRecord>(
      `INSERT INTO chat_messages (conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, created_at`,
      [conversationId, senderId, ciphertext, iv, authTag, ratchetHeader ? JSON.stringify(ratchetHeader) : null]
    );

    // Bump conversation updated_at
    await query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);

    return msg!;
  }
}

export const chatService = new ChatService();
