import type { ChatMessage, ChatConversation, ChatParticipant } from './types';

const CHAT_STORAGE_PREFIX = 'skill-swap.chat.v1.';
const CHAT_UPDATE_EVENT = 'skill-swap:chat-updated';

interface UserChatStorage {
  conversations: Record<string, {
    partner: ChatParticipant;
    unreadCount: number;
    updatedAt: string;
  }>;
  messages: Record<string, ChatMessage[]>; // keyed by partnerId
}

function getStorageKey(userId: string): string {
  return `${CHAT_STORAGE_PREFIX}${userId}`;
}

function loadUserStore(userId: string): UserChatStorage {
  if (!userId || userId === 'guest') {
    return { conversations: {}, messages: {} };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.conversations === 'object' && typeof parsed.messages === 'object') {
        return parsed as UserChatStorage;
      }
    }
  } catch {
    // ignore parse error
  }
  return { conversations: {}, messages: {} };
}

function saveUserStore(userId: string, store: UserChatStorage): void {
  if (!userId || userId === 'guest') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(CHAT_UPDATE_EVENT, { detail: { userId } }));
  } catch {
    // ignore storage quota error
  }
}

let cachedConversationsRaw: string | null = null;
let cachedConversationsUserId: string = '';
let cachedConversationsList: ChatConversation[] = [];

let cachedMessagesRaw: string | null = null;
let cachedMessagesKey: string = '';
let cachedMessagesList: ChatMessage[] = [];

export const chatService = {
  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(CHAT_UPDATE_EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(CHAT_UPDATE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },

  getConversations(userId: string): ChatConversation[] {
    if (!userId || userId === 'guest') {
      return [];
    }
    const key = getStorageKey(userId);
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      // ignore
    }

    if (raw === cachedConversationsRaw && userId === cachedConversationsUserId) {
      return cachedConversationsList;
    }

    cachedConversationsRaw = raw;
    cachedConversationsUserId = userId;
    const store = loadUserStore(userId);
    const convos: ChatConversation[] = [];

    for (const [partnerId, convData] of Object.entries(store.conversations)) {
      const msgs = store.messages[partnerId] || [];
      const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
      convos.push({
        id: partnerId,
        partnerId,
        partner: convData.partner,
        lastMessage,
        unreadCount: convData.unreadCount || 0,
        updatedAt: convData.updatedAt || (lastMessage ? lastMessage.createdAt : new Date().toISOString()),
      });
    }

    cachedConversationsList = convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return cachedConversationsList;
  },

  getMessages(userId: string, partnerId: string): ChatMessage[] {
    if (!userId || userId === 'guest' || !partnerId) {
      return [];
    }
    const key = `${getStorageKey(userId)}:${partnerId}`;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(getStorageKey(userId));
    } catch {
      // ignore
    }

    if (raw === cachedMessagesRaw && key === cachedMessagesKey) {
      return cachedMessagesList;
    }

    cachedMessagesRaw = raw;
    cachedMessagesKey = key;
    const store = loadUserStore(userId);
    cachedMessagesList = store.messages[partnerId] || [];
    return cachedMessagesList;
  },

  sendMessage(
    currentUserId: string,
    partner: ChatParticipant,
    text: string
  ): ChatMessage {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty');
    }

    const store = loadUserStore(currentUserId);
    const now = new Date().toISOString();
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: currentUserId,
      recipientId: partner.id,
      text: trimmed,
      createdAt: now,
    };

    const existingMsgs = store.messages[partner.id] || [];
    store.messages[partner.id] = [...existingMsgs, message];

    store.conversations[partner.id] = {
      partner,
      unreadCount: 0,
      updatedAt: now,
    };

    saveUserStore(currentUserId, store);

    // If partner is another local user account, also deliver the message to partner's isolated inbox
    try {
      const partnerStore = loadUserStore(partner.id);
      const partnerExisting = partnerStore.messages[currentUserId] || [];
      partnerStore.messages[currentUserId] = [...partnerExisting, message];
      
      // Load current user profile info for partner's conversation entry
      let currentSenderInfo: ChatParticipant = {
        id: currentUserId,
        name: 'Collaborator',
        username: 'collaborator',
      };
      try {
        const sessionRaw = localStorage.getItem('skill-swap.session.v1');
        if (sessionRaw) {
          const sess = JSON.parse(sessionRaw);
          if (sess?.identity) {
            currentSenderInfo = {
              id: sess.identity.id,
              name: sess.identity.name,
              username: sess.identity.username,
              avatarUrl: sess.identity.avatarUrl,
              bio: sess.identity.bio,
              location: sess.identity.location,
              skills: sess.identity.skills,
            };
          }
        }
      } catch {
        // fallback
      }

      partnerStore.conversations[currentUserId] = {
        partner: currentSenderInfo,
        unreadCount: (partnerStore.conversations[currentUserId]?.unreadCount || 0) + 1,
        updatedAt: now,
      };
      saveUserStore(partner.id, partnerStore);
    } catch {
      // ignore
    }

    return message;
  },

  markConversationRead(userId: string, partnerId: string): void {
    const store = loadUserStore(userId);
    if (store.conversations[partnerId] && store.conversations[partnerId].unreadCount > 0) {
      store.conversations[partnerId].unreadCount = 0;
      saveUserStore(userId, store);
    }
  },

  ensureConversation(userId: string, partner: ChatParticipant): void {
    const store = loadUserStore(userId);
    if (!store.conversations[partner.id]) {
      store.conversations[partner.id] = {
        partner,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };
      if (!store.messages[partner.id]) {
        store.messages[partner.id] = [];
      }
      saveUserStore(userId, store);
    }
  },
};
