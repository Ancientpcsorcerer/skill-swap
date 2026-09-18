import { apiClient } from '../../lib/api';
import { e2eeService } from '../../lib/crypto/e2eeService';
import type { ChatMessage, ChatConversation, ChatParticipant } from './types';

type Subscriber = () => void;

const EMPTY_CONVERSATIONS: ChatConversation[] = [];
const EMPTY_MESSAGES: ChatMessage[] = [];

class ChatStoreService {
  private subscribers = new Set<Subscriber>();
  private conversationsMap = new Map<string, ChatConversation>();
  private messagesMap = new Map<string, ChatMessage[]>(); // Keyed by conversationId
  private conversationPartnerIndex = new Map<string, string>(); // partnerId -> conversationId
  private loadingConversations = false;
  private loadingMessages = new Set<string>();
  private sortedConversationsCache: ChatConversation[] = EMPTY_CONVERSATIONS;

  subscribe = (callback: Subscriber): (() => void) => {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  };

  private notify() {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Chat store subscriber error:', err);
      }
    });
  }

  private rebuildConversationsCache() {
    if (this.conversationsMap.size === 0) {
      this.sortedConversationsCache = EMPTY_CONVERSATIONS;
    } else {
      this.sortedConversationsCache = Array.from(this.conversationsMap.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
  }

  /**
   * Returns currently loaded conversations from memory with referential stability
   */
  getConversations(currentUserId: string): ChatConversation[] {
    if (!currentUserId || currentUserId === 'guest') return EMPTY_CONVERSATIONS;

    // Trigger asynchronous fetch if not loaded
    if (this.conversationsMap.size === 0 && !this.loadingConversations) {
      this.fetchConversations(currentUserId);
    }

    return this.sortedConversationsCache;
  }

  /**
   * Fetches conversation list from the backend API
   */
  async fetchConversations(currentUserId: string): Promise<ChatConversation[]> {
    if (!currentUserId || currentUserId === 'guest') return EMPTY_CONVERSATIONS;
    this.loadingConversations = true;
    try {
      const serverConvos = await apiClient.chat.getConversations();
      for (const sc of serverConvos) {
        let lastMessage: ChatMessage | undefined;
        if (sc.last_msg_cipher && sc.last_msg_iv && sc.last_msg_tag) {
          const decryptedText = await e2eeService.decryptMessage(sc.id, {
            ciphertext: sc.last_msg_cipher,
            iv: sc.last_msg_iv,
            authTag: sc.last_msg_tag,
          });
          lastMessage = {
            id: sc.last_msg_id,
            senderId: sc.last_msg_sender,
            conversationId: sc.id,
            text: decryptedText,
            createdAt: sc.last_msg_created || sc.updated_at,
            status: 'delivered',
          };
        }

        const partner: ChatParticipant = {
          id: sc.partner.id,
          name: sc.partner.name,
          username: sc.partner.username,
          avatarUrl: sc.partner.avatar_url,
          bio: sc.partner.bio,
          skills: sc.partner.skills || [],
        };

        const convo: ChatConversation = {
          id: sc.id,
          partnerId: partner.id,
          partner,
          lastMessage,
          unreadCount: 0,
          updatedAt: sc.updated_at,
        };

        this.conversationsMap.set(sc.id, convo);
        this.conversationPartnerIndex.set(partner.id, sc.id);
      }
      this.rebuildConversationsCache();
      this.notify();
      return this.sortedConversationsCache;
    } catch (err) {
      console.warn('Could not fetch conversations from server:', err);
      return this.sortedConversationsCache;
    } finally {
      this.loadingConversations = false;
    }
  }

  /**
   * Resolves or creates a canonical conversation with a partner
   */
  async ensureConversation(currentUserId: string, partner: ChatParticipant): Promise<ChatConversation | null> {
    if (!currentUserId || !partner?.id) return null;

    // Check if already in memory
    const existingId = this.conversationPartnerIndex.get(partner.id);
    if (existingId && this.conversationsMap.has(existingId)) {
      return this.conversationsMap.get(existingId)!;
    }

    try {
      const serverConvo = await apiClient.chat.getOrCreateConversation(partner.id);
      const convo: ChatConversation = {
        id: serverConvo.id,
        partnerId: partner.id,
        partner,
        unreadCount: 0,
        updatedAt: serverConvo.updated_at,
      };

      this.conversationsMap.set(serverConvo.id, convo);
      this.conversationPartnerIndex.set(partner.id, serverConvo.id);
      this.rebuildConversationsCache();
      this.notify();
      return convo;
    } catch (err) {
      console.error('Failed to create or get conversation:', err);
      return null;
    }
  }

  /**
   * Returns loaded messages for a conversation
   */
  getMessages(conversationId: string): ChatMessage[] {
    if (!conversationId) return EMPTY_MESSAGES;

    // Trigger asynchronous fetch if not loaded
    if (!this.messagesMap.has(conversationId) && !this.loadingMessages.has(conversationId)) {
      this.fetchMessages(conversationId);
    }

    return this.messagesMap.get(conversationId) || EMPTY_MESSAGES;
  }

  /**
   * Fetches and decrypts message history from PostgreSQL backend
   */
  async fetchMessages(conversationId: string): Promise<ChatMessage[]> {
    if (!conversationId || this.loadingMessages.has(conversationId)) {
      return this.messagesMap.get(conversationId) || [];
    }

    this.loadingMessages.add(conversationId);
    try {
      const serverMessages = await apiClient.chat.getMessages(conversationId);
      const decryptedList: ChatMessage[] = [];

      for (const sm of serverMessages) {
        let text = '';
        if (!sm.is_deleted && sm.ciphertext && sm.iv && sm.auth_tag) {
          text = await e2eeService.decryptMessage(conversationId, {
            ciphertext: sm.ciphertext,
            iv: sm.iv,
            authTag: sm.auth_tag,
          });
        }

        decryptedList.push({
          id: sm.id,
          senderId: sm.sender_id,
          senderName: sm.sender_name,
          conversationId: sm.conversation_id,
          text,
          createdAt: sm.created_at,
          replyToMessageId: sm.reply_to_message_id,
          forwardedFromMessageId: sm.forwarded_from_message_id,
          isDeleted: Boolean(sm.is_deleted),
          editedAt: sm.edited_at,
          replyToMessage: sm.reply_to_message
            ? {
                id: sm.reply_to_message.id,
                senderId: sm.reply_to_message.sender_id,
                senderName: sm.reply_to_message.sender_name,
                isDeleted: Boolean(sm.reply_to_message.is_deleted),
              }
            : null,
          status: 'delivered',
        });
      }

      // Populate decrypted reply text from sibling messages where possible
      const msgMap = new Map<string, string>();
      decryptedList.forEach((m) => {
        if (!m.isDeleted && m.text) msgMap.set(m.id, m.text);
      });
      decryptedList.forEach((m) => {
        if (m.replyToMessage && !m.replyToMessage.isDeleted && msgMap.has(m.replyToMessage.id)) {
          m.replyToMessage.text = msgMap.get(m.replyToMessage.id);
        }
      });

      this.messagesMap.set(conversationId, decryptedList);
      this.notify();
      return decryptedList;
    } catch (err) {
      console.error('Failed to fetch message history:', err);
      return this.messagesMap.get(conversationId) || [];
    } finally {
      this.loadingMessages.delete(conversationId);
    }
  }

  /**
   * Sends an encrypted message: optimistic UI -> real network request -> server persistence
   */
  async sendMessage(
    currentUserId: string,
    conversationId: string,
    partner: ChatParticipant,
    text: string,
    replyToMessageId?: string | null
  ): Promise<ChatMessage> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Message cannot be empty');

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      recipientId: partner.id,
      conversationId,
      text: trimmed,
      createdAt: now,
      replyToMessageId: replyToMessageId || null,
      status: 'sending',
    };

    // 1. Optimistic UI update
    const currentList = this.messagesMap.get(conversationId) || [];
    this.messagesMap.set(conversationId, [...currentList, optimisticMsg]);

    const convo = this.conversationsMap.get(conversationId);
    if (convo) {
      convo.lastMessage = optimisticMsg;
      convo.updatedAt = now;
    }
    this.rebuildConversationsCache();
    this.notify();

    // 2. Client-side E2EE encryption
    try {
      const encrypted = await e2eeService.encryptMessage(conversationId, trimmed);

      // 3. Real network HTTP POST request to backend API
      const serverRecord = await apiClient.chat.sendMessage(conversationId, {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        ratchetHeader: encrypted.ratchetHeader,
        reply_to_message_id: replyToMessageId || null,
      });

      // 4. Reconcile optimistic message with authoritative server record
      const updatedList = (this.messagesMap.get(conversationId) || []).map((m) => {
        if (m.id === tempId) {
          return {
            ...m,
            id: serverRecord.id,
            createdAt: serverRecord.created_at,
            replyToMessageId: serverRecord.reply_to_message_id,
            forwardedFromMessageId: serverRecord.forwarded_from_message_id,
            replyToMessage: serverRecord.reply_to_message
              ? {
                  id: serverRecord.reply_to_message.id,
                  senderId: serverRecord.reply_to_message.sender_id,
                  senderName: serverRecord.reply_to_message.sender_name,
                  isDeleted: Boolean(serverRecord.reply_to_message.is_deleted),
                }
              : null,
            status: 'delivered' as const,
          };
        }
        return m;
      });

      this.messagesMap.set(conversationId, updatedList);
      if (convo) {
        convo.lastMessage = {
          ...optimisticMsg,
          id: serverRecord.id,
          createdAt: serverRecord.created_at,
          status: 'delivered',
        };
        convo.updatedAt = serverRecord.created_at;
      }
      this.rebuildConversationsCache();
      this.notify();

      return {
        ...optimisticMsg,
        id: serverRecord.id,
        createdAt: serverRecord.created_at,
        status: 'delivered',
      };
    } catch (err: any) {
      console.error('Chat send failed over network:', err);

      // 5. Mark failed on error so user can retry
      const failedList = (this.messagesMap.get(conversationId) || []).map((m) => {
        if (m.id === tempId) {
          return {
            ...m,
            status: 'failed' as const,
            error: err.message || 'Network delivery failed',
          };
        }
        return m;
      });

      this.messagesMap.set(conversationId, failedList);
      this.notify();
      throw err;
    }
  }

  /**
   * Edits own message with client-side re-encryption
   */
  async editMessage(
    conversationId: string,
    messageId: string,
    newText: string
  ): Promise<ChatMessage> {
    const trimmed = newText.trim();
    if (!trimmed) throw new Error('Message cannot be empty');

    const encrypted = await e2eeService.encryptMessage(conversationId, trimmed);
    const serverRecord = await apiClient.chat.editMessage(messageId, {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      ratchetHeader: encrypted.ratchetHeader,
    });

    const list = this.messagesMap.get(conversationId) || [];
    const updatedList = list.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          text: trimmed,
          editedAt: serverRecord.edited_at || new Date().toISOString(),
        };
      }
      return m;
    });

    this.messagesMap.set(conversationId, updatedList);
    this.notify();
    return updatedList.find((m) => m.id === messageId)!;
  }

  /**
   * Deletes own message on server while preserving reply thread integrity
   */
  async deleteMessage(
    conversationId: string,
    messageId: string
  ): Promise<void> {
    await apiClient.chat.deleteMessage(messageId);
    const list = this.messagesMap.get(conversationId) || [];
    const updatedList = list.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          text: '',
          isDeleted: true,
          editedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    this.messagesMap.set(conversationId, updatedList);
    this.notify();
  }

  /**
   * Forwards a message to another conversation with re-encryption for that conversation
   */
  async forwardMessage(
    targetConversationId: string,
    messageId: string,
    decryptedText: string
  ): Promise<ChatMessage> {
    const encrypted = await e2eeService.encryptMessage(targetConversationId, decryptedText);
    const serverRecord = await apiClient.chat.forwardMessage(messageId, {
      targetConversationId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      ratchetHeader: encrypted.ratchetHeader,
    });

    await this.fetchMessages(targetConversationId);
    return {
      id: serverRecord.id,
      senderId: serverRecord.sender_id,
      conversationId: targetConversationId,
      text: decryptedText,
      createdAt: serverRecord.created_at,
      forwardedFromMessageId: serverRecord.forwarded_from_message_id,
      status: 'delivered',
    };
  }

  /**
   * Retries sending a failed message
   */
  async retryMessage(
    currentUserId: string,
    conversationId: string,
    partner: ChatParticipant,
    messageId: string
  ): Promise<void> {
    const list = this.messagesMap.get(conversationId) || [];
    const target = list.find((m) => m.id === messageId);
    if (!target) return;

    // Remove failed message and resend
    this.messagesMap.set(
      conversationId,
      list.filter((m) => m.id !== messageId)
    );
    await this.sendMessage(currentUserId, conversationId, partner, target.text);
  }

  markConversationRead(_currentUserId: string, _partnerId: string): void {
    // Unread count is purely local visual state
  }

  getConversationIdForPartner(partnerId: string): string | undefined {
    return this.conversationPartnerIndex.get(partnerId);
  }
}

export const chatService = new ChatStoreService();
