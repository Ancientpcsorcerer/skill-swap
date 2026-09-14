import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../app/session/SessionProvider';
import { SearchField } from '../../app/components/SearchField';
import { Tabs, FilterControl } from '../../app/components/UI';
import { ProfilePreview } from '../profile/ProfilePreview';
import { useConnect } from './ConnectProvider';
import { matchesPerson, suggestPeople } from './selectors';
import { PersonRow } from './components/PersonRow';
import { ConnectionAction } from './components/ConnectionAction';
import { RequestsPanel } from './components/RequestsPanel';
import { ReciprocalRadar } from './ReciprocalRadar';
import type { ConnectTab, Person } from './types';
import '../../styles/design-tokens.css';
import '../../styles/connect-profile-chat.css';

export function ConnectModule({
  searchRequest = 0,
  onSearchHandled,
}: {
  searchRequest?: number;
  onSearchHandled?: () => void;
}) {
  const { session } = useSession();
  const {
    people,
    loading,
    requests,
    error,
    announcement,
    retry,
    tab,
    setTab,
    query,
    setQuery,
  } = useConnect();
  const [preview, setPreview] = useState<Person | null>(null);
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Relevance');
  const [showRadar, setShowRadar] = useState(true);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRequest) {
      setTab('people');
      search.current?.focus();
      onSearchHandled?.();
    }
  }, [searchRequest, setTab, onSearchHandled]);

  const suggestions = session ? suggestPeople(people, session.identity) : [];
  const candidates =
    tab === 'suggested'
      ? suggestions.length
        ? suggestions.map((item) => item.person)
        : people.slice(0, 6)
      : people;

  const listed = candidates
    .filter(
      (person) =>
        matchesPerson(person, query) && (filter === 'All' || person.skills.includes(filter))
    )
    .sort((a, b) => (sort === 'Name' ? a.name.localeCompare(b.name) : 0));

  const count = requests.filter(
    (request) => request.direction === 'incoming' && request.status === 'pending'
  ).length;

  return (
    <section className="connect-module">
      <header className="connect-directory-header">
        <div className="connect-header-copy">
          <span className="connect-kicker">✦ THE RECIPROCAL DIRECTORY</span>
          <h1 className="connect-title">Meet People. Share Skills. Build Together.</h1>
          <p className="connect-description">
            Discover polymaths and peer mentors ready for 1-on-1 reciprocal skill swaps.
          </p>
          <div className="connect-metrics-bar">
            <span className="connect-metric-pill">
              <strong>{people.length}</strong> Creators
            </span>
            <span className="connect-metric-pill">
              <strong>100%</strong> Reciprocal
            </span>
            <span className="connect-metric-pill">
              <strong>0</strong> Platform Currency
            </span>
          </div>
        </div>

        <div className="search-with-filter connect-search-bar">
          <SearchField
            inputRef={search}
            label="Search the people directory"
            placeholder="Search people, skills, projects..."
            value={query}
            onChange={setQuery}
          />
          <FilterControl
            value={filter}
            onChange={setFilter}
            options={Array.from(new Set(people.flatMap((person) => person.skills))).sort()}
          />
        </div>
      </header>

      <div className="module-toolbar">
        <Tabs
          label="Connect sections"
          values={['People', 'Suggested', 'Requests']}
          value={tab[0].toUpperCase() + tab.slice(1)}
          onChange={(value) => setTab(value.toLowerCase() as ConnectTab)}
        />
        <div className="toolbar-end">
          <button
            type="button"
            className={`radar-chip ${showRadar ? 'is-active' : ''}`}
            onClick={() => setShowRadar((prev) => !prev)}
            aria-pressed={showRadar}
            style={{ marginRight: '8px' }}
          >
            {showRadar ? 'Hide Radar' : '⇄ Show Radar'}
          </button>
          <span className="connect-count-indicator">
            {listed.length} creators{tab === 'requests' ? ' / ' + count + ' incoming' : ''}
          </span>
          <label>
            Sort by{' '}
            <select
              aria-label="Sort people"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option>Relevance</option>
              <option>Name</option>
            </select>
          </label>
        </div>
      </div>

      <div className="workspace-sr-only" role="status">
        {announcement}
      </div>
      {error && (
        <p role="alert">
          {error} <button onClick={retry}>Try again</button>
        </p>
      )}

      {/* Reciprocal Skill Radar Banner */}
      {showRadar && tab !== 'requests' && !query && (
        <ReciprocalRadar people={people} onPreview={setPreview} session={session} />
      )}

      {loading ? (
        <p className="workspace-empty">Loading people...</p>
      ) : tab === 'requests' ? (
        <RequestsPanel onPreview={setPreview} />
      ) : listed.length ? (
        <ul className="people-list people-grid">
          {listed.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              onPreview={setPreview}
              action={<ConnectionAction person={person} />}
              note={
                tab === 'suggested'
                  ? suggestions.find((item) => item.person.id === person.id)?.reason
                  : undefined
              }
            />
          ))}
        </ul>
      ) : (
        <div className="workspace-empty">
          <h2>No people found</h2>
          <p>Try another name, skill or interest.</p>
          <button
            className="quiet-button"
            onClick={() => {
              setQuery('');
              setFilter('All');
            }}
          >
            Clear search
          </button>
        </div>
      )}

      <ProfilePreview
        person={preview}
        onClose={() => setPreview(null)}
        action={
          preview ? (
            <ConnectionAction person={preview} onRespond={() => setPreview(null)} />
          ) : undefined
        }
      />
    </section>
  );
}
