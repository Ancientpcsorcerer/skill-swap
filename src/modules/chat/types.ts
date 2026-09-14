export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string; // ISO string
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
