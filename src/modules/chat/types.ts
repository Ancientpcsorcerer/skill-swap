export type MessageStatus = 'sending' | 'delivered' | 'failed';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  recipientId?: string;
  conversationId?: string;
  text: string;
  createdAt: string; // ISO string
  status?: MessageStatus;
  error?: string;
  replyToMessageId?: string | null;
  forwardedFromMessageId?: string | null;
  isDeleted?: boolean;
  editedAt?: string | null;
  replyToMessage?: {
    id: string;
    senderId: string;
    senderName: string;
    text?: string;
    isDeleted?: boolean;
  } | null;
}

export interface ChatParticipant {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string;
  location?: string;
  skills?: string[];
}

export interface ChatConversation {
  id: string;
  partnerId: string;
  partner: ChatParticipant;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}
