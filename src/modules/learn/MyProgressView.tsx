import { useState, type FormEvent } from 'react';
import { Tabs, SectionHeader } from '../../app/components/UI';
import { Artwork } from '../../app/components/Artwork';
import { learningPaths } from '../../app/data/catalog';
import { useAuthGate } from '../../app/session/AuthGateContext';
import type { NormalizedLearningRecord, NormalizedLearningGoal } from './useLearnState';
import type { LearningPath } from '../../app/data/models';

interface MyProgressViewProps {
  records: NormalizedLearningRecord[];
  goals: NormalizedLearningGoal[];
  loading: boolean;
  isAuthenticated: boolean;
  statusTab: 'In Progress' | 'Saved' | 'Completed';
  onStatusTabChange: (status: 'In Progress' | 'Saved' | 'Completed') => void;
  onSelectPath: (path: LearningPath) => void;
  onAddGoal: (goal: string) => Promise<NormalizedLearningGoal | null>;
  onDeleteGoal: (id: string) => Promise<boolean>;
  onSwitchToExplore: () => void;
}

export function MyProgressView({
  records,
  goals,
  loading,
  isAuthenticated,
  statusTab,
  onStatusTabChange,
  onSelectPath,
  onAddGoal,
  onDeleteGoal,
  onSwitchToExplore,
}: MyProgressViewProps) {
  const { requireAuth } = useAuthGate();
  const [goalMessage, setGoalMessage] = useState('');
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Filter records by current status tab
  const filteredRecords = records.filter((r) => r.status === statusTab);
  const matchedPaths = filteredRecords.flatMap((record) => {
    const found = learningPaths.find((p) => p.id === record.pathId);
    return found ? [{ record, path: found }] : [];
  });

  async function handleGoalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get('goal') || '').trim();
    if (!value) return;

    if (
      !requireAuth('set a learning goal', async () => {
        setIsSubmittingGoal(true);
        await onAddGoal(value);
        form.reset();
        setGoalMessage('Learning goal saved.');
        setIsSubmittingGoal(false);
      })
    ) {
      return;
    }

    setIsSubmittingGoal(true);
    await onAddGoal(value);
    form.reset();
    setGoalMessage('Learning goal saved.');
    setIsSubmittingGoal(false);
  }

  return (
    <section id="panel-progress" role="tabpanel" aria-labelledby="tab-progress" className="my-progress-container">
      {/* Guest Authentication Prompt */}
      {!isAuthenticated && (
        <div className="learn-honest-state">
          <h3>Track Your Personal Craft Journey</h3>
          <p>
            Your active learning paths, verified progress percentages, and personal learning goals are stored in your secure account. Sign in to cultivate and track your skills.
          </p>
          <div className="learn-honest-state-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => requireAuth('view and track your learning progress', () => {})}
            >
              Sign In to Track Progress
            </button>
            <button type="button" className="secondary-button" onClick={onSwitchToExplore}>
              Explore Available Skills &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Status Segmented Tabs */}
      <div className="my-progress-header">
        <SectionHeader title="Active Learning & Craft" />
        <div className="my-progress-status-pills">
          <Tabs
            label="My learning status"
            values={['In Progress', 'Saved', 'Completed']}
            value={statusTab}
            onChange={(val) => onStatusTabChange(val as 'In Progress' | 'Saved' | 'Completed')}
          />
        </div>
      </div>

      {/* Real Server Records List */}
      <div className="my-learning-list">
        {loading ? (
          <p className="workspace-empty">Loading your learning records from the server...</p>
        ) : matchedPaths.length > 0 ? (
          <div className="active-learning-grid">
            {matchedPaths.map(({ path, record }) => (
              <div key={path.id} className="active-learning-card">
                <div className="active-learning-top">
                  <div className="active-learning-art">
                    <Artwork art={path.art} />
                  </div>
                  <div className="active-learning-info">
                    <strong className="active-learning-title">{path.title}</strong>
                    <span className={`active-learning-status-tag ${record.status === 'Completed' ? 'completed' : ''}`}>
                      {record.status}
                    </span>
                  </div>
                </div>

                <div className="active-learning-progress-wrap">
                  <div className="active-learning-progress-label">
                    <span>Progress</span>
                    <span>{record.progress}%</span>
                  </div>
                  <progress
                    className="active-learning-progress-bar"
                    max="100"
                    value={record.progress}
                    aria-label={`${path.title} progress`}
                  />
                </div>

                <div className="active-learning-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => onSelectPath(path)}
                  >
                    Continue Path &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="learning-empty learn-honest-state">
            <p>
              {statusTab === 'In Progress'
                ? 'You have no paths currently in progress. Choose a skill from Explore Skills to begin.'
                : statusTab === 'Saved'
                ? 'No saved paths yet. Save interesting topics to return to them later.'
                : 'Your completed skill journeys will appear here once achieved.'}
            </p>
            {statusTab === 'In Progress' && (
              <div className="learn-honest-state-actions">
                <button type="button" className="primary-button" onClick={onSwitchToExplore}>
                  Explore Skills Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Learning Goals Section */}
      <div className="learning-goals-card">
        <SectionHeader title="Learning Goals" />
        <p className="desc">Define clear milestones to stay focused and accountable.</p>

        <form className="stack-form" onSubmit={handleGoalSubmit}>
          <input
            name="goal"
            aria-label="Learning goal"
            placeholder="What goal do you want to achieve? (e.g. Photograph a story about my neighbourhood)"
            required
            minLength={3}
            maxLength={160}
            disabled={isSubmittingGoal}
          />
          <button type="submit" className="primary-button" disabled={isSubmittingGoal}>
            Set Goal
          </button>
        </form>

        <p role="status" className="inline-status">
          {goalMessage}
        </p>

        {goals.length > 0 ? (
          <div className="learning-goals-list" style={{ marginTop: '16px' }}>
            {goals.map((item) => (
              <div key={item.id} className="learning-goal-item">
                <span className="learning-goal">{item.goal}</span>
                {isAuthenticated && (
                  <button
                    type="button"
                    className="learning-goal-delete-btn"
                    title="Remove goal"
                    aria-label={`Remove goal: ${item.goal}`}
                    onClick={() => onDeleteGoal(item.id)}
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="workspace-empty" style={{ margin: '14px 0 0 0', fontSize: '12px' }}>
            No goals recorded yet. Write your first focus area above.
          </p>
        )}
      </div>
    </section>
  );
}
