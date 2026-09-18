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
  reply_to_message_id?: string | null;
  forwarded_from_message_id?: string | null;
  is_deleted: boolean;
  edited_at?: string | null;
  created_at: string;
  reply_to_message?: {
    id: string;
    sender_id: string;
    sender_name: string;
    is_deleted: boolean;
  } | null;
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

    const rows = await query<any>(
      `SELECT m.id, m.conversation_id, m.sender_id, u.name as sender_name,
              m.ciphertext, m.iv, m.auth_tag, m.ratchet_header,
              m.reply_to_message_id, m.forwarded_from_message_id,
              m.is_deleted, m.edited_at, m.created_at,
              rm.sender_id as reply_sender_id, ru.name as reply_sender_name, rm.is_deleted as reply_is_deleted
       FROM chat_messages m
       JOIN users u ON u.id = m.sender_id
       LEFT JOIN chat_messages rm ON rm.id = m.reply_to_message_id
       LEFT JOIN users ru ON ru.id = rm.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return rows.map((r) => ({
      id: r.id,
      conversation_id: r.conversation_id,
      sender_id: r.sender_id,
      sender_name: r.sender_name,
      ciphertext: r.is_deleted ? '' : r.ciphertext,
      iv: r.is_deleted ? '' : r.iv,
      auth_tag: r.is_deleted ? '' : r.auth_tag,
      ratchet_header: r.is_deleted ? null : r.ratchet_header,
      reply_to_message_id: r.reply_to_message_id,
      forwarded_from_message_id: r.forwarded_from_message_id,
      is_deleted: Boolean(r.is_deleted),
      edited_at: r.edited_at,
      created_at: r.created_at,
      reply_to_message: r.reply_to_message_id
        ? {
            id: r.reply_to_message_id,
            sender_id: r.reply_sender_id,
            sender_name: r.reply_sender_name,
            is_deleted: Boolean(r.reply_is_deleted),
          }
        : null,
    }));
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    ciphertext: string,
    iv: string,
    authTag: string,
    ratchetHeader?: Record<string, unknown>,
    replyToMessageId?: string | null
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
      `INSERT INTO chat_messages (conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, reply_to_message_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, reply_to_message_id, forwarded_from_message_id, is_deleted, edited_at, created_at`,
      [
        conversationId,
        senderId,
        ciphertext,
        iv,
        authTag,
        ratchetHeader ? JSON.stringify(ratchetHeader) : null,
        replyToMessageId || null,
      ]
    );

    // Bump conversation updated_at
    await query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);

    return msg!;
  }

  async editMessage(
    userId: string,
    messageId: string,
    ciphertext: string,
    iv: string,
    authTag: string,
    ratchetHeader?: Record<string, unknown>
  ): Promise<ChatMessageRecord> {
    const msg = await queryOne<{ id: string; sender_id: string; is_deleted: boolean }>(
      `SELECT id, sender_id, is_deleted FROM chat_messages WHERE id = $1`,
      [messageId]
    );
    if (!msg) throw new NotFoundError('Message not found');
    if (msg.sender_id !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }
    if (msg.is_deleted) {
      throw new BadRequestError('Cannot edit a deleted message');
    }

    const updated = await queryOne<ChatMessageRecord>(
      `UPDATE chat_messages
       SET ciphertext = $1, iv = $2, auth_tag = $3, ratchet_header = $4, edited_at = NOW()
       WHERE id = $5
       RETURNING id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, reply_to_message_id, forwarded_from_message_id, is_deleted, edited_at, created_at`,
      [ciphertext, iv, authTag, ratchetHeader ? JSON.stringify(ratchetHeader) : null, messageId]
    );
    return updated!;
  }

  async deleteMessage(userId: string, messageId: string): Promise<ChatMessageRecord> {
    const msg = await queryOne<{ id: string; sender_id: string }>(
      `SELECT id, sender_id FROM chat_messages WHERE id = $1`,
      [messageId]
    );
    if (!msg) throw new NotFoundError('Message not found');
    if (msg.sender_id !== userId) {
      throw new ForbiddenError('You can only delete your own messages');
    }

    const updated = await queryOne<ChatMessageRecord>(
      `UPDATE chat_messages
       SET is_deleted = true, ciphertext = '', iv = '', auth_tag = '', edited_at = NOW()
       WHERE id = $1
       RETURNING id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, reply_to_message_id, forwarded_from_message_id, is_deleted, edited_at, created_at`,
      [messageId]
    );
    return updated!;
  }

  async forwardMessage(
    userId: string,
    messageId: string,
    targetConversationId: string,
    ciphertext?: string,
    iv?: string,
    authTag?: string,
    ratchetHeader?: Record<string, unknown>
  ): Promise<ChatMessageRecord> {
    const original = await queryOne<{
      id: string;
      conversation_id: string;
      ciphertext: string;
      iv: string;
      auth_tag: string;
      ratchet_header: any;
      is_deleted: boolean;
    }>(
      `SELECT id, conversation_id, ciphertext, iv, auth_tag, ratchet_header, is_deleted
       FROM chat_messages WHERE id = $1`,
      [messageId]
    );
    if (!original || original.is_deleted) {
      throw new NotFoundError('Original message not found or deleted');
    }

    // Verify user has access to target conversation
    const targetConv = await queryOne<{
      id: string;
      participant_one_id: string | null;
      participant_two_id: string | null;
      type: string;
    }>(
      `SELECT id, participant_one_id, participant_two_id, type FROM chat_conversations WHERE id = $1`,
      [targetConversationId]
    );
    if (!targetConv) throw new NotFoundError('Target conversation not found');

    let isAuthorized = false;
    if (targetConv.type === 'class_group') {
      const isGroupMember = await queryOne<{ user_id: string }>(
        `SELECT user_id FROM chat_group_members WHERE conversation_id = $1 AND user_id = $2`,
        [targetConversationId, userId]
      );
      isAuthorized = !!isGroupMember;
    } else {
      isAuthorized = targetConv.participant_one_id === userId || targetConv.participant_two_id === userId;
    }

    if (!isAuthorized) {
      throw new ForbiddenError('You are not authorized to forward messages to this conversation');
    }

    const finalCiphertext = ciphertext || original.ciphertext;
    const finalIv = iv || original.iv;
    const finalAuthTag = authTag || original.auth_tag;
    const finalHeader = ratchetHeader ? JSON.stringify(ratchetHeader) : (original.ratchet_header ? JSON.stringify(original.ratchet_header) : null);

    const msg = await queryOne<ChatMessageRecord>(
      `INSERT INTO chat_messages (conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, forwarded_from_message_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, conversation_id, sender_id, ciphertext, iv, auth_tag, ratchet_header, reply_to_message_id, forwarded_from_message_id, is_deleted, edited_at, created_at`,
      [
        targetConversationId,
        userId,
        finalCiphertext,
        finalIv,
        finalAuthTag,
        finalHeader,
        original.id,
      ]
    );

    await query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`, [targetConversationId]);
    return msg!;
  }
}

export const chatService = new ChatService();

