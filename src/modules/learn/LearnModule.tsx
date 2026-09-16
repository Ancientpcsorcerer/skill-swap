import { useEffect, useState, type FormEvent } from 'react';
import { Panel, Tabs } from '../../app/components/UI';
import { Artwork } from '../../app/components/Artwork';
import { learningPaths, trendingSkills } from '../../app/data/catalog';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { navigate, useApplicationRoute } from '../../app/navigation';
import { useLearnState } from './useLearnState';
import { LearnHero } from './LearnHero';
import { LearnModeSwitcher } from './LearnModeSwitcher';
import { ExploreSkillsView } from './ExploreSkillsView';
import { MyProgressView } from './MyProgressView';
import { LearningEnvironment } from './LearningEnvironment';
import type { LearningPath } from '../../app/data/models';
import '../../styles/learn.css';

export function LearnModule() {
  const route = useApplicationRoute();
  const { requireAuth } = useAuthGate();
  const learnState = useLearnState();

  // URL deep-linking synchronization
  const tabQuery = route.query.get('tab');
  const pathQuery = route.query.get('path');

  const [activeMode, setActiveMode] = useState<'explore' | 'progress'>(() => {
    return tabQuery === 'progress' ? 'progress' : 'explore';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [learningTab, setLearningTab] = useState<'In Progress' | 'Saved' | 'Completed'>('In Progress');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [asideGoalMessage, setAsideGoalMessage] = useState('');

  // Sync mode with route if tab parameter changes
  useEffect(() => {
    if (tabQuery === 'progress' && activeMode !== 'progress') {
      setActiveMode('progress');
    } else if (tabQuery === 'explore' && activeMode !== 'explore') {
      setActiveMode('explore');
    }
  }, [tabQuery]);

  // Sync path parameter for direct modal deep links
  useEffect(() => {
    if (pathQuery) {
      const found = learningPaths.find((p) => p.id === pathQuery);
      if (found) {
        setSelectedPath(found);
      }
    }
  }, [pathQuery]);

  function handleSelectMode(newMode: 'explore' | 'progress') {
    setActiveMode(newMode);
    navigate('learn', undefined, false, { tab: newMode });
  }

  function handleAsideGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get('goal') || '').trim();
    if (!value) return;

    if (
      !requireAuth('set a learning goal', async () => {
        await learnState.addGoal(value);
        form.reset();
        setAsideGoalMessage('Learning goal saved.');
      })
    ) {
      return;
    }

    learnState.addGoal(value);
    form.reset();
    setAsideGoalMessage('Learning goal saved.');
  }

  // Filter tracked records for aside
  const trackedRecords = learnState.records.filter((r) => r.status === learningTab);
  const asideMatchedRecords = trackedRecords.flatMap((record) => {
    const found = learningPaths.find((p) => p.id === record.pathId);
    return found ? [{ record, path: found }] : [];
  });

  const inProgressCount = learnState.records.filter((r) => r.status === 'In Progress').length;

  return (
    <div className="module-columns learn-layout learn-module-root">
      <div className="module-main">
        {/* Editorial Hero */}
        <LearnHero activeCount={inProgressCount} />

        {/* Segmented Mode Switcher */}
        <LearnModeSwitcher
          activeMode={activeMode}
          onSelectMode={handleSelectMode}
          activeProgressCount={inProgressCount}
        />

        {/* Immersive Dedicated Learning Environment or Segmented Views */}
        {selectedPath ? (
          <LearningEnvironment
            path={selectedPath}
            onBack={() => {
              setSelectedPath(null);
              navigate('learn', undefined, false, { tab: activeMode });
            }}
            record={learnState.records.find((r) => r.pathId === selectedPath.id)}
            onUpdateRecord={learnState.updateRecord}
          />
        ) : activeMode === 'explore' ? (
          <ExploreSkillsView
            query={searchQuery}
            onQueryChange={setSearchQuery}
            category={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onSelectPath={setSelectedPath}
          />
        ) : (
          <MyProgressView
            records={learnState.records}
            goals={learnState.goals}
            loading={learnState.loading}
            isAuthenticated={learnState.isAuthenticated}
            statusTab={learningTab}
            onStatusTabChange={setLearningTab}
            onSelectPath={setSelectedPath}
            onAddGoal={learnState.addGoal}
            onDeleteGoal={learnState.deleteGoal}
            onSwitchToExplore={() => handleSelectMode('explore')}
          />
        )}
      </div>

      {/* Persistent Workspace Aside */}
      <aside className="module-aside">
        <Panel title="My Learning">
          <Tabs
            label="My learning status"
            values={['In Progress', 'Saved', 'Completed']}
            value={learningTab}
            onChange={(val) => setLearningTab(val as 'In Progress' | 'Saved' | 'Completed')}
          />
          <div className="my-learning-list">
            {asideMatchedRecords.map(({ path, record }) => (
              <button
                key={path.id}
                type="button"
                onClick={() => setSelectedPath(path)}
                aria-label={`${path.title}, ${record.progress}% completed`}
              >
                <Artwork art={path.art} />
                <span>
                  <strong>{path.title}</strong>
                  <progress
                    max="100"
                    value={record.progress}
                    aria-label={`${path.title} progress`}
                  />
                  <small>
                    {record.progress}% &middot; {record.status}
                  </small>
                </span>
              </button>
            ))}

            {!asideMatchedRecords.length && (
              <div className="learning-empty">
                <p>
                  {learningTab === 'In Progress'
                    ? 'Choose a path and start learning.'
                    : learningTab === 'Saved'
                    ? 'Save a path to return to it later.'
                    : 'Your completed paths will appear here.'}
                </p>
                {learningTab === 'In Progress' &&
                  learningPaths.slice(0, 3).map((path) => (
                    <button
                      key={path.id}
                      type="button"
                      onClick={() => setSelectedPath(path)}
                      aria-label={`Explore ${path.title}`}
                    >
                      <Artwork art={path.art} />
                      <span>
                        {path.title}
                        <small>Explore path &rarr;</small>
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Set a Learning Goal" description="Stay consistent. Build your future.">
          <form className="stack-form" onSubmit={handleAsideGoalSubmit}>
            <input
              name="goal"
              aria-label="Learning goal"
              placeholder="What do you want to learn?"
              required
              minLength={3}
              maxLength={160}
            />
            <button type="submit" className="primary-button">
              Set Goal
            </button>
          </form>
          <p role="status" className="inline-status">
            {asideGoalMessage}
          </p>
          {learnState.goals.slice(0, 3).map((g) => (
            <p key={g.id} className="learning-goal">
              {g.goal}
            </p>
          ))}
        </Panel>

        <Panel title="Trending Skills">
          <ol className="trending-list">
            {trendingSkills.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMode('explore');
                    setSelectedCategory('All');
                    setSearchQuery(skill);
                  }}
                >
                  {skill}
                  <span>&#8599;</span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>

        <blockquote className="workspace-panel">
          &ldquo;A skill learned is a door opened to a brighter tomorrow.&rdquo;
        </blockquote>
      </aside>
    </div>
  );
}
