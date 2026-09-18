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
  type?: 'direct' | 'class_group';
  class_id?: string | null;
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
  sender_name?: string;
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
      `INSERT INTO chat_conversations (participant_one_id, participant_two_id, type, updated_at)
       VALUES ($1, $2, 'direct', NOW())
       ON CONFLICT (participant_one_id, participant_two_id)
       DO UPDATE SET updated_at = chat_conversations.updated_at
       RETURNING id, updated_at`,
      [p1, p2]
    );

    return {
      id: row!.id,
      type: 'direct',
      partner,
      updated_at: row!.updated_at,
    };
  }

  async getClassConversation(classId: string, currentUserId: string): Promise<ConversationSummary> {
    // Check class exists
    const cls = await queryOne<{ id: string; title: string; skill: string; teacher_id: string }>(
      `SELECT id, title, skill, teacher_id FROM classes WHERE id = $1`,
      [classId]
    );
    if (!cls) throw new NotFoundError('Class not found');

    // Verify user is member of class
    const isMember = await queryOne<{ student_id: string }>(
      `SELECT student_id FROM class_members WHERE class_id = $1 AND student_id = $2`,
      [classId, currentUserId]
    );
    if (!isMember && cls.teacher_id !== currentUserId) {
      throw new ForbiddenError('You are not enrolled in this class');
    }

    let conv = await queryOne<{ id: string; updated_at: string }>(
      `SELECT id, updated_at FROM chat_conversations WHERE class_id = $1 AND type = 'class_group'`,
      [classId]
    );

    if (!conv) {
      conv = await queryOne<{ id: string; updated_at: string }>(
        `INSERT INTO chat_conversations (class_id, type, updated_at)
         VALUES ($1, 'class_group', NOW())
         RETURNING id, updated_at`,
        [classId]
      );
    }

    // Ensure user is in chat_group_members
    await query(
      `INSERT INTO chat_group_members (conversation_id, user_id, joined_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conv!.id, currentUserId]
    );

    return {
      id: conv!.id,
      type: 'class_group',
      class_id: cls.id,
      partner: {
        id: cls.id,
        name: `${cls.title} (Class Group)`,
        username: cls.skill.toLowerCase().replace(/\s+/g, '-'),
        bio: `Class Group Chat for ${cls.title}`,
      },
      updated_at: conv!.updated_at,
    };
  }

  async getConversations(currentUserId: string): Promise<ConversationSummary[]> {
    // 1. Direct conversations
    const directRows = await query<{
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
         AND (c.type IS NULL OR c.type = 'direct')
       ORDER BY c.updated_at DESC`,
      [currentUserId]
    );

    // 2. Class group conversations
    const groupRows = await query<{
      id: string;
      updated_at: string;
      class_id: string;
      class_title: string;
      class_skill: string;
      last_msg_id: string | null;
      last_msg_sender: string | null;
      last_msg_cipher: string | null;
      last_msg_iv: string | null;
      last_msg_tag: string | null;
      last_msg_created: string | null;
    }>(
      `SELECT c.id, c.updated_at, c.class_id,
              cls.title as class_title, cls.skill as class_skill,
              m.id as last_msg_id, m.sender_id as last_msg_sender,
              m.ciphertext as last_msg_cipher, m.iv as last_msg_iv,
              m.auth_tag as last_msg_tag, m.created_at as last_msg_created
       FROM chat_conversations c
       JOIN classes cls ON cls.id = c.class_id
       JOIN chat_group_members gm ON gm.conversation_id = c.id AND gm.user_id = $1
       LEFT JOIN LATERAL (
         SELECT id, sender_id, ciphertext, iv, auth_tag, created_at
         FROM chat_messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) m ON true
       WHERE c.type = 'class_group'
       ORDER BY c.updated_at DESC`,
      [currentUserId]
    );

    const directList: ConversationSummary[] = directRows.map((r) => ({
      id: r.id,
      type: 'direct',
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

    const groupList: ConversationSummary[] = groupRows.map((r) => ({
      id: r.id,
      type: 'class_group',
      class_id: r.class_id,
      partner: {
        id: r.class_id,
        name: `${r.class_title} (Class Group)`,
        username: r.class_skill.toLowerCase().replace(/\s+/g, '-'),
        bio: `Class Group for ${r.class_title}`,
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

    const all = [...directList, ...groupList];
    all.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    return all;
  }

  async getMessages(conversationId: string, currentUserId: string): Promise<ChatMessageRecord[]> {
    const conv = await queryOne<{
      id: string;
      participant_one_id: string | null;
      participant_two_id: string | null;
      type: string;
      class_id: string | null;
    }>(
      `SELECT id, participant_one_id, participant_two_id, type, class_id FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    let isAuthorized = false;
    if (conv.type === 'class_group') {
      const isGroupMember = await queryOne<{ user_id: string }>(
        `SELECT user_id FROM chat_group_members WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, currentUserId]
      );
      isAuthorized = !!isGroupMember;
    } else {
      isAuthorized = conv.participant_one_id === currentUserId || conv.participant_two_id === currentUserId;
    }

    if (!isAuthorized) {
      throw new ForbiddenError('You are not authorized to view messages in this conversation');
    }

    const messages = await query<ChatMessageRecord>(
      `SELECT m.id, m.conversation_id, m.sender_id, u.name as sender_name,
              m.ciphertext, m.iv, m.auth_tag, m.ratchet_header, m.created_at
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
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

    const conv = await queryOne<{
      id: string;
      participant_one_id: string | null;
      participant_two_id: string | null;
      type: string;
    }>(
      `SELECT id, participant_one_id, participant_two_id, type FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    let isAuthorized = false;
    if (conv.type === 'class_group') {
      const isGroupMember = await queryOne<{ user_id: string }>(
        `SELECT user_id FROM chat_group_members WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, senderId]
      );
      isAuthorized = !!isGroupMember;
    } else {
      isAuthorized = conv.participant_one_id === senderId || conv.participant_two_id === senderId;
    }

    if (!isAuthorized) {
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

