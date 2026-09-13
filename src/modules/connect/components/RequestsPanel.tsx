import { useConnect } from '../ConnectProvider';
import { matchesPerson } from '../selectors';
import type { Person } from '../types';
import { PersonRow } from './PersonRow';
export function RequestsPanel({ onPreview }: { onPreview: (person: Person) => void }) {
  const { requests, people, query, busy, respond } = useConnect();
  return <div className="requests-panel">{(['incoming', 'outgoing'] as const).map(direction => {
    const entries = requests.filter(request => request.direction === direction && request.status === 'pending')
      .flatMap(request => { const person = people.find(person => person.id === request.personId); return person && matchesPerson(person, query) ? [{ request, person }] : []; });
    const title = direction === 'incoming' ? 'Incoming' : 'Outgoing';
    return <section key={direction} aria-labelledby={'requests-' + direction}><h2 id={'requests-' + direction}>{title}<span>{entries.length}</span></h2>
      {entries.length ? <ul className="people-list">{entries.map(({ request, person }) => <PersonRow key={request.id} person={person} onPreview={onPreview}
        action={direction === 'incoming' ? <div className="request-response"><button className="connection-button" type="button" disabled={busy.includes(person.id)} onClick={() => void respond(request, 'accepted')}>Accept</button>
          <button className="workspace-text-button" type="button" disabled={busy.includes(person.id)} onClick={() => void respond(request, 'declined')}>Decline</button></div>
          : <div className="request-pending"><span>Request Sent</span><span>Pending</span></div>} />)}</ul>
        : <p className="workspace-empty">{query ? 'No matching requests.' : direction === 'incoming' ? 'You are all caught up. New requests will appear here.' : 'No outgoing requests. Find someone in People to connect with.'}</p>}
    </section>;
  })}</div>;
}
