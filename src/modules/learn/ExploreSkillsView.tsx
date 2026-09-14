import { useState } from 'react';
import { SearchField } from '../../app/components/SearchField';
import { FilterControl, SectionHeader } from '../../app/components/UI';
import { Artwork } from '../../app/components/Artwork';
import { PersonRow } from '../connect/components/PersonRow';
import { ConnectionAction } from '../connect/components/ConnectionAction';
import { ProfilePreview } from '../profile/ProfilePreview';
import { learningCategories, learningPaths } from '../../app/data/catalog';
import { useConnect } from '../connect/ConnectProvider';
import { matchesPerson } from '../connect/selectors';
import type { LearningPath } from '../../app/data/models';
import type { Person } from '../connect/types';

interface ExploreSkillsViewProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  onSelectPath: (path: LearningPath) => void;
}

export function ExploreSkillsView({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  onSelectPath,
}: ExploreSkillsViewProps) {
  const { people } = useConnect();
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [showAllMentors, setShowAllMentors] = useState(false);
  const [previewPerson, setPreviewPerson] = useState<Person | null>(null);

  // Cross-domain search matching
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matchingPaths = learningPaths.filter((path) => {
    const matchesCategory =
      category === 'All' ||
      path.category === category ||
      path.topics.some((topic) => topic.toLowerCase() === category.toLowerCase());

    const matchesTerms =
      terms.length === 0 ||
      terms.every((term) =>
        [path.title, path.description, path.category, ...path.topics]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );

    return matchesCategory && matchesTerms;
  });

  const mentorIds = new Set(matchingPaths.flatMap((p) => p.mentorIds));
  const matchingMentors = people.filter((person) => {
    if (query || category !== 'All') {
      return mentorIds.has(person.id) || matchesPerson(person, query || category);
    }
    return showAllMentors || ['arjun', 'ishita', 'rohan', 'kavya'].includes(person.id);
  });

  const displayedPaths = showAllPaths ? matchingPaths : matchingPaths.slice(0, 6);
  const displayedMentors = showAllMentors ? matchingMentors : matchingMentors.slice(0, 4);

  return (
    <section id="panel-explore" role="tabpanel" aria-labelledby="tab-explore">
      <div className="learn-search-wrap">
        <div className="search-with-filter">
          <SearchField
            label="Learning search"
            placeholder="What do you want to learn? (e.g. Photography, Robotics, AI)"
            value={query}
            onChange={onQueryChange}
          />
          <FilterControl
            value={category}
            onChange={onCategoryChange}
            options={learningCategories}
          />
        </div>
      </div>

      <div className="learning-chips chip-buttons learn-chips-row" role="group" aria-label="Topic categories">
        {['All', ...learningCategories].map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={category === cat}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <SectionHeader
        title="Learning Opportunities & Paths"
        action={matchingPaths.length > 6 ? (showAllPaths ? 'Show less' : 'View all') : undefined}
        onAction={() => setShowAllPaths((prev) => !prev)}
      />

      {matchingPaths.length > 0 ? (
        <div className="learning-path-grid learn-path-grid">
          {displayedPaths.map((path) => (
            <button
              key={path.id}
              type="button"
              className="learning-path-card learn-path-card"
              onClick={() => onSelectPath(path)}
              aria-label={`View learning path: ${path.title}`}
            >
              <div className="learn-path-card-art">
                <Artwork art={path.art} />
              </div>
              <div className="learn-path-card-body">
                <span className="learn-path-card-category">{path.category}</span>
                <strong className="learn-path-card-title">{path.title}</strong>
                <span className="learn-path-card-desc">{path.description}</span>
                <div className="learn-path-card-footer">
                  <span>
                    <strong>{path.mentorIds.length}</strong> {path.mentorIds.length === 1 ? 'mentor' : 'mentors'}
                  </span>
                  <span>{path.resources} curated resources</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="learn-honest-state">
          <h3>No learning paths found</h3>
          <p>
            No matches found for &ldquo;{query || category}&rdquo;. Try a broader keyword, clear your filters, or explore all disciplines.
          </p>
          <div className="learn-honest-state-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                onQueryChange('');
                onCategoryChange('All');
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <SectionHeader
        title="Connect with Mentors & Practitioners"
        action={query || category !== 'All' ? 'Reset search' : matchingMentors.length > 4 ? (showAllMentors ? 'Show less' : 'View all') : undefined}
        onAction={() => {
          if (query || category !== 'All') {
            onQueryChange('');
            onCategoryChange('All');
          } else {
            setShowAllMentors((prev) => !prev);
          }
        }}
      />

      {matchingMentors.length > 0 ? (
        <ul className="people-list mentor-grid" aria-label="Mentors list">
          {displayedMentors.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              onPreview={setPreviewPerson}
              variant="mentor"
              action={<ConnectionAction person={person} />}
            />
          ))}
        </ul>
      ) : (
        <div className="learn-honest-state">
          <h3>No mentors matching your criteria</h3>
          <p>
            We could not find active mentors for &ldquo;{query || category}&rdquo; right now. Explore other skills or reset filters to connect with our broader practitioner community.
          </p>
        </div>
      )}

      <ProfilePreview
        person={previewPerson}
        onClose={() => setPreviewPerson(null)}
        action={previewPerson ? <ConnectionAction person={previewPerson} onRespond={() => setPreviewPerson(null)} /> : undefined}
      />
    </section>
  );
}
