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

  return (
    <button
      type="button"
      className="connection-button"
      data-state={connected || sent ? 'settled' : 'default'}
      disabled={pending || connected || sent}
      aria-label={pending ? 'Sending request to ' + person.name : undefined}
      onClick={() => {
        if (!requireAuth('connect with ' + person.name, handleAction)) {
          return;
        }
        handleAction();
      }}
    >
      {pending ? 'Sending...' : connected ? 'Connected' : sent ? 'Request Sent' : incoming ? 'Respond' : 'Connect'}
    </button>
  );
}
