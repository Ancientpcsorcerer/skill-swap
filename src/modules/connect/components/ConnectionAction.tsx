import { navigate } from '../../../app/navigation';
import { useConnect } from '../ConnectProvider';
import { connectionFor } from '../selectors';
import type { Person } from '../types';
import { useAuthGate } from '../../../app/session/AuthGateContext';

export function ConnectionAction({ person, onRespond }: { person: Person; onRespond?: () => void }) {
  const { requests, busy, send, setTab } = useConnect();
  const { requireAuth } = useAuthGate();
  const request = connectionFor(person.id, requests);
  const pending = busy.includes(person.id);
  const connected = request?.status === 'accepted';
  const sent = request?.direction === 'outgoing' && request.status === 'pending';
  const incoming = request?.direction === 'incoming' && request.status === 'pending';

  const handleAction = () => {
    if (incoming) {
      setTab('requests');
      onRespond?.();
      navigate('connect');
    } else {
      void send(person);
    }
  };

  if (connected) {
    return (
      <div className="connection-action-connected-group">
        <button
          type="button"
          className="connection-button"
          data-state="settled"
          disabled
        >
          Connected
        </button>
        <button
          type="button"
          className="secondary-button connection-message-btn"
          onClick={() => {
            if (
              !requireAuth('message ' + person.name, () =>
                navigate('chat', undefined, false, { user: person.id })
              )
            ) {
              return;
            }
            navigate('chat', undefined, false, { user: person.id });
          }}
        >
          Message
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="connection-button"
      data-state={sent ? 'settled' : 'default'}
      disabled={pending || sent}
      aria-label={pending ? 'Sending request to ' + person.name : undefined}
      onClick={() => {
        if (!requireAuth('connect with ' + person.name, handleAction)) {
          return;
        }
        handleAction();
      }}
    >
      {pending ? 'Sending...' : sent ? 'Request Sent' : incoming ? 'Respond' : 'Connect'}
    </button>
  );
}
