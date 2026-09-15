import { useState, useEffect, useRef, useSyncExternalStore, type FormEvent, type KeyboardEvent } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { useConnect } from '../connect/ConnectProvider';
import { navigate, useApplicationRoute } from '../../app/navigation';
import { Avatar } from '../../app/components/Avatar';
import { Icon } from '../../app/components/Icon';
import { chatService } from './chatService';
import { ChatContextDrawer } from './ChatContextDrawer';
import type { ChatParticipant } from './types';
import '../../styles/design-tokens.css';
import '../../styles/connect-profile-chat.css';

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function ChatModule() {
  const { session } = useSession();
  const { openAuthModal } = useAuthGate();
  const { people, requests } = useConnect();
  const route = useApplicationRoute();

  const currentUserId = session?.identity.id || '';
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [showCollaboratorsList, setShowCollaboratorsList] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to reactive chat store updates
  const conversations = useSyncExternalStore(
    chatService.subscribe,
    () => chatService.getConversations(currentUserId),
    () => []
  );

  // Connected collaborators (status === 'accepted')
  const acceptedIds = new Set(
    requests.filter((r) => r.status === 'accepted').map((r) => r.personId)
  );
  const connectedCollaborators = people.filter((p) => acceptedIds.has(p.id));

  // Handle URL deep-linking (?user=<userId>)
  useEffect(() => {
    if (!currentUserId) return;
    const targetUserId = route.user;
    if (targetUserId && targetUserId !== currentUserId) {
      if (selectedPartnerId !== targetUserId) {
        // Find person details
        const person = people.find((p) => p.id === targetUserId);
        if (person) {
          const participant: ChatParticipant = {
            id: person.id,
            name: person.name,
            username: person.username || person.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            bio: person.description,
            skills: person.skills,
          };
          chatService.ensureConversation(currentUserId, participant);
        }
        setSelectedPartnerId(targetUserId);
      }
    } else if (!selectedPartnerId && conversations.length > 0) {
      setSelectedPartnerId(conversations[0].partnerId);
    }
  }, [route.user, currentUserId, people, conversations, selectedPartnerId]);

  // Mark conversation read on selection
  useEffect(() => {
    if (currentUserId && selectedPartnerId) {
      chatService.markConversationRead(currentUserId, selectedPartnerId);
    }
  }, [currentUserId, selectedPartnerId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPartnerId, conversations]);

  if (!session) {
    return (
      <section className="chat-module chat-guest-view">
        <div className="chat-guest-card">
          <Icon name="chat" />
          <h1>Sign in to start chatting</h1>
          <p>
            Connect with collaborators, exchange ideas, and build projects together on Skill Swap.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => openAuthModal('login')}
          >
            Sign In / Register
          </button>
        </div>
      </section>
    );
  }

  const activeConversation = conversations.find((c) => c.partnerId === selectedPartnerId);
  const conversationId = activeConversation?.id || (selectedPartnerId ? chatService.getConversationIdForPartner(selectedPartnerId) : undefined);

  // When conversation ID becomes available or selected partner changes, fetch history from backend
  useEffect(() => {
    if (conversationId) {
      chatService.fetchMessages(conversationId);
    }
  }, [conversationId]);

  const activePartner =
    activeConversation?.partner ||
    (() => {
      const person = people.find((p) => p.id === selectedPartnerId);
      if (person) {
        return {
          id: person.id,
          name: person.name,
          username: person.username || person.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          bio: person.description,
          skills: person.skills,
        } as ChatParticipant;
      }
      return null;
    })();

  const activeMessages = conversationId
    ? chatService.getMessages(conversationId)
    : [];

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activePartner) return;
    const textToSend = inputText.trim();
    setInputText('');
    inputRef.current?.focus();

    try {
      let conv = activeConversation;
      if (!conv) {
        conv = (await chatService.ensureConversation(currentUserId, activePartner)) || undefined;
      }
      if (conv) {
        await chatService.sendMessage(currentUserId, conv.id, activePartner, textToSend);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startChatWithCollaborator = async (collaborator: (typeof connectedCollaborators)[0]) => {
    const participant: ChatParticipant = {
      id: collaborator.id,
      name: collaborator.name,
      username: collaborator.username || collaborator.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      bio: collaborator.description,
      skills: collaborator.skills,
    };
    const conv = await chatService.ensureConversation(currentUserId, participant);
    setSelectedPartnerId(collaborator.id);
    setShowCollaboratorsList(false);
    if (conv) {
      chatService.fetchMessages(conv.id);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.partner.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.partner.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <section className="chat-module">
      <div className={`chat-container ${drawerOpen && activePartner ? '' : 'drawer-collapsed'}`}>
        {/* LEFT PANE: Conversation List */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-title-row">
              <h1>Chat</h1>
              <button
                type="button"
                className="quiet-button chat-new-button"
                title="New message with a collaborator"
                onClick={() => setShowCollaboratorsList((prev) => !prev)}
              >
                + New Chat
              </button>
            </div>
            <div className="chat-search-wrap">
              <input
                type="text"
                className="chat-search-input"
                placeholder="Search conversations..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Collaborator Quick Start Tray */}
          {showCollaboratorsList && (
            <div className="chat-collaborators-picker">
              <div className="chat-picker-header">
                <span>Start conversation with connected collaborators</span>
                <button
                  type="button"
                  className="quiet-button"
                  onClick={() => setShowCollaboratorsList(false)}
                >
                  &times;
                </button>
              </div>
              {connectedCollaborators.length > 0 ? (
                <ul className="chat-picker-list">
                  {connectedCollaborators.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="chat-picker-item"
                        onClick={() => startChatWithCollaborator(c)}
                      >
                        <Avatar name={c.name} small />
                        <div className="chat-picker-info">
                          <strong>{c.name}</strong>
                          <small>@{c.username || c.name.toLowerCase()}</small>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="chat-picker-empty">
                  No connected collaborators yet.{' '}
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() => navigate('connect')}
                  >
                    Find connections &rarr;
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Conversation List */}
          <div className="chat-conversation-list" role="list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.partnerId === selectedPartnerId;
                return (
                  <button
                    key={conv.partnerId}
                    type="button"
                    className={`chat-conversation-item ${isSelected ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedPartnerId(conv.partnerId);
                      setShowCollaboratorsList(false);
                    }}
                  >
                    <Avatar name={conv.partner.name} small />
                    <div className="chat-conversation-details">
                      <div className="chat-conversation-top">
                        <strong className="chat-partner-name">{conv.partner.name}</strong>
                        {conv.lastMessage && (
                          <span className="chat-timestamp">
                            {formatTimestamp(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="chat-conversation-preview-row">
                        <p className="chat-preview-text">
                          {conv.lastMessage ? conv.lastMessage.text : 'Conversation started'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="chat-unread-badge">{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="chat-empty-conversations">
                <p>No conversations yet.</p>
                {connectedCollaborators.length > 0 ? (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowCollaboratorsList(true)}
                  >
                    Message a Collaborator
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => navigate('connect')}
                  >
                    Connect with People &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER PANE: Active Conversation */}
        <main className="chat-main-pane">
          {activePartner ? (
            <div className="chat-thread-container">
              {/* Header */}
              <header className="chat-thread-header">
                <div className="chat-thread-partner-info">
                  <Avatar name={activePartner.name} />
                  <div>
                    <h2 className="chat-thread-name">{activePartner.name}</h2>
                    <p className="chat-thread-handle">
                      @{activePartner.username || activePartner.name.toLowerCase()} &middot;{' '}
                      <span className="chat-connection-indicator">Collaborator</span>
                    </p>
                  </div>
                </div>
                <div className="chat-thread-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`radar-chip ${drawerOpen ? 'is-active' : ''}`}
                    onClick={() => setDrawerOpen((prev) => !prev)}
                    title="Toggle Collaborator Dossier Drawer"
                  >
                    {drawerOpen ? 'Hide Dossier' : '✦ View Dossier'}
                  </button>
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() =>
                      navigate('profile', undefined, false, { user: activePartner.id })
                    }
                  >
                    View Profile &rarr;
                  </button>
                </div>
              </header>

              {/* Message Feed */}
              <div className="chat-messages-scroll" role="log" aria-live="polite">
                {activeMessages.length > 0 ? (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-message-row ${isMe ? 'is-outgoing' : 'is-incoming'}`}
                      >
                        {!isMe && <Avatar name={activePartner.name} small />}
                        <div className="chat-message-bubble">
                          <p className="chat-message-text" style={{ margin: 0 }}>{msg.text}</p>
                          <div className="chat-message-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <span className="chat-message-time">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                            {isMe && msg.status === 'sending' && (
                              <span className="chat-status-pill sending" title="Sending...">⏳</span>
                            )}
                            {isMe && msg.status === 'delivered' && (
                              <span className="chat-status-pill delivered" title="Delivered to server">✓</span>
                            )}
                            {isMe && msg.status === 'failed' && (
                              <button
                                type="button"
                                className="chat-retry-pill"
                                onClick={() => conversationId && activePartner && chatService.retryMessage(currentUserId, conversationId, activePartner, msg.id)}
                                title="Delivery failed. Click to retry."
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  borderRadius: '9999px',
                                  fontSize: '0.7rem',
                                  padding: '1px 6px',
                                  cursor: 'pointer',
                                }}
                              >
                                ⚠️ Failed &middot; Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="chat-thread-empty">
                    <p>
                      This is the beginning of your conversation with{' '}
                      <strong>{activePartner.name}</strong>.
                    </p>
                    <small>Say hello, ask about a project, or share what you are building.</small>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <form className="chat-composer" onSubmit={handleSend}>
                <textarea
                  ref={inputRef}
                  className="chat-composer-input"
                  placeholder={`Message ${activePartner.name}... (Press Enter to send)`}
                  rows={2}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button
                  type="submit"
                  className="primary-button chat-send-button"
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                >
                  Send
                </button>
              </form>
            </div>
          ) : (
            <div className="chat-no-selection">
              <Icon name="chat" />
              <h2>Your Conversations</h2>
              <p>Select an ongoing conversation or reach out to a collaborator from Connect.</p>
              {connectedCollaborators.length > 0 && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowCollaboratorsList(true)}
                >
                  Start a Conversation
                </button>
              )}
            </div>
          )}
        </main>

        {/* RIGHT PANE: Collapsible Context Drawer */}
        {drawerOpen && activePartner && (
          <ChatContextDrawer
            partner={activePartner}
            session={session}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </div>
    </section>
  );
}
