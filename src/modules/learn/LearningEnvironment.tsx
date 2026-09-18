import { useState, useEffect } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { Avatar } from '../../app/components/Avatar';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { useConnect } from '../connect/ConnectProvider';
import { navigate } from '../../app/navigation';
import { api } from '../../lib/api';
import type { LearningPath, ClassSession } from '../../app/data/models';
import type { NormalizedLearningRecord } from './useLearnState';

interface LearningEnvironmentProps {
  path: LearningPath;
  onBack: () => void;
  record?: NormalizedLearningRecord;
  onUpdateRecord: (
    pathId: string,
    status: 'In Progress' | 'Saved' | 'Completed',
    progress: number
  ) => Promise<unknown>;
}

export function LearningEnvironment({
  path,
  onBack,
  record,
  onUpdateRecord,
}: LearningEnvironmentProps) {
  const { requireAuth } = useAuthGate();
  const { people, loading: isPeopleLoading } = useConnect();
  const [progress, setProgress] = useState(record?.progress || 0);
  const [status, setStatus] = useState<'In Progress' | 'Saved' | 'Completed'>(
    record?.status || 'In Progress'
  );
  const [savedNotice, setSavedNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.teaching
      .getSessions(path.id)
      .then((data) => {
        if (isMounted) setSessions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load track sessions:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [path.id]);



  useEffect(() => {
    if (record) {
      setProgress(record.progress);
      setStatus(record.status);
    }
  }, [record]);

  // Resolve mentors from backend-connected practitioners
  const matchingMentors = people.filter((p) => {
    // 1. Direct match on mentorIds: match against user ID, username, or name prefix
    const isMentorIdMatch = path.mentorIds.some(
      (mId) =>
        mId.toLowerCase() === p.id.toLowerCase() ||
        (p.username && mId.toLowerCase() === p.username.toLowerCase()) ||
        p.name.toLowerCase().startsWith(mId.toLowerCase())
    );
    if (isMentorIdMatch) return true;

    // 2. Topics / skills matching (case-insensitive substring)
    return p.skills.some((s) =>
      path.topics.some(
        (t) =>
          t.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(t.toLowerCase())
      ) ||
      path.title.toLowerCase().includes(s.toLowerCase()) ||
      path.category.toLowerCase().includes(s.toLowerCase())
    );
  });

  const milestones = [
    { title: 'Foundations & Tooling Setup', desc: 'Core fundamentals, workspace configuration, and syntax primer.' },
    { title: 'Applied Technique & Paradigm Workshop', desc: 'Hands-on guided builds, design patterns, and debugging idioms.' },
    { title: 'Peer Collaboration & Code Exchange', desc: 'Reciprocal code review, skill swaps, and pair programming.' },
    { title: 'Capstone Showcase & Synthesis', desc: 'Deploy a production-grade artifact and contribute back to the community.' },
  ];

  async function handleSaveProgress(newProgress: number, newStatus = status) {
    if (!requireAuth('save your learning progress', () => handleSaveProgress(newProgress, newStatus))) {
      return;
    }
    setProgress(newProgress);
    setIsSaving(true);
    try {
      await onUpdateRecord(path.id, newStatus, newProgress);
      setSavedNotice('Progress synchronized to cloud.');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch {
      setSavedNotice('Failed to sync. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="learning-environment-container">
      {/* Top Bar Navigation */}
      <div className="learning-env-topbar">
        <button
          type="button"
          className="quiet-button learning-env-back-btn"
          onClick={onBack}
        >
          &larr; Back to Learning Hub
        </button>
        <div className="learning-env-status-pill">
          <span className={`status-badge ${status === 'Completed' ? 'is-completed' : ''}`}>
            {status} ({progress}%)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="learning-env-grid">
        {/* Left Column: Learning Identity, Progress, Milestones */}
        <div className="learning-env-main-col">
          {/* Identity Header */}
          <div className="learning-env-header">
            <div className="learning-env-art">
              <Artwork art={path.art} />
            </div>
            <div className="learning-env-header-details">
              <span className="learning-env-category-badge">
                {path.category} &bull; {path.resources} Interactive Units
              </span>
              <h1 className="learning-env-title">{path.title}</h1>
              <p className="learning-env-desc">{path.description}</p>
            </div>
          </div>

          {/* Progress Card */}
          <div className="learning-env-card learning-env-progress-card">
            <div className="learning-env-progress-header">
              <span className="learning-env-section-kicker">Track Progress</span>
              <span className="learning-env-progress-value">{progress}% COMPLETE</span>
            </div>
            <div className="learning-env-progress-track">
              <div
                className="learning-env-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleSaveProgress(Number(e.target.value))}
              className="learning-env-progress-slider"
              aria-label="Adjust learning progress"
            />
            {savedNotice && (
              <small className="learning-env-sync-notice">{savedNotice}</small>
            )}
          </div>

          {/* Curriculum Milestones */}
          <div className="learning-env-card learning-env-milestones-card">
            <h2 className="learning-env-card-title">Curriculum Milestones</h2>
            <div className="learning-env-milestones-list">
              {milestones.map((m, idx) => {
                const stepPercent = (idx + 1) * 25;
                const isChecked = progress >= stepPercent;
                return (
                  <div
                    key={m.title}
                    onClick={() => handleSaveProgress(isChecked ? idx * 25 : stepPercent)}
                    className={`learning-env-milestone-item ${isChecked ? 'is-checked' : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSaveProgress(isChecked ? idx * 25 : stepPercent);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="learning-env-milestone-checkbox"
                    />
                    <div className="learning-env-milestone-content">
                      <strong>
                        {idx + 1}. {m.title}
                      </strong>
                      <p>{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Mentor, Session, Actions */}
        <div className="learning-env-side-col">
          {/* Real Backend Mentor Section */}
          <div className="learning-env-card learning-env-mentor-card">
            <span className="learning-env-section-kicker">Learning with</span>
            {isPeopleLoading && people.length === 0 ? (
              <div className="learning-env-empty-box">
                <p>Connecting to mentor roster...</p>
              </div>
            ) : matchingMentors.length > 0 ? (
              <div className="learning-env-mentor-list">
                {matchingMentors.slice(0, 2).map((mentor) => (
                  <div key={mentor.id} className="learning-env-mentor-item">
                    <div className="learning-env-mentor-profile">
                      <Avatar name={mentor.name} personId={mentor.id} avatarUrl={mentor.avatarUrl} />
                      <div className="learning-env-mentor-details">
                        <strong className="learning-env-mentor-name">{mentor.name}</strong>
                        <small className="learning-env-mentor-skills">
                          {mentor.skills.length > 0 ? mentor.skills.join(' · ') : mentor.description || 'Mentor'}
                        </small>
                      </div>
                    </div>
                    <div className="learning-env-mentor-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate('profile', undefined, false, { user: mentor.id })}
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate('chat', undefined, false, { user: mentor.id })}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="learning-env-empty-box">
                <p>No dedicated mentor assigned yet for this track.</p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate('connect', undefined, false, { skill: path.topics[0] })}
                >
                  Find Mentors in Connect &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Backend Session / Zoom Section */}
          <div className="learning-env-card learning-env-session-card">
            <span className="learning-env-section-kicker">Upcoming Session</span>
            {sessions.length > 0 ? (
              <div className="learning-env-active-session" style={{ padding: '8px 0' }}>
                <strong className="session-active-heading" style={{ display: 'block', fontSize: '15px', color: '#141514', marginBottom: '4px' }}>
                  {sessions[0].title}
                </strong>
                <p className="session-active-meta" style={{ fontSize: '12.5px', color: '#656862', margin: '0 0 10px 0' }}>
                  Hosted by <strong>{sessions[0].teacher_name}</strong> &bull; {new Date(sessions[0].scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({sessions[0].duration_minutes}m)
                </p>
                {sessions[0].meeting_url && (
                  <a
                    href={sessions[0].meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="primary-button session-join-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '6px 14px', fontSize: '12.5px' }}
                  >
                    Join Live Session &rarr;
                  </a>
                )}
              </div>
            ) : (
              <div className="learning-env-empty-session">
                <strong className="session-empty-heading">NO UPCOMING SESSION</strong>
                <p className="session-empty-text">No live session has been scheduled yet for this learning track.</p>
              </div>
            )}
          </div>


          {/* Track Actions Card */}
          <div className="learning-env-card learning-env-actions-card">
            <span className="learning-env-section-kicker">Track Actions</span>
            <div className="learning-env-action-buttons">
              <button
                type="button"
                className="primary-button"
                onClick={() => handleSaveProgress(100, 'Completed')}
                disabled={isSaving || progress === 100}
              >
                {progress === 100 ? '✓ Path Completed' : 'Complete All Units (100%)'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleSaveProgress(progress, 'Saved')}
                disabled={isSaving}
              >
                Save for Later
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('connect', undefined, false, { skill: path.topics[0] })}
              >
                Find Practice Partner &rarr;
              </button>
            </div>
          </div>

          {/* Topics Deck */}
          <div className="learning-env-card learning-env-topics-card">
            <span className="learning-env-section-kicker">Competencies</span>
            <div className="learning-env-topics-deck">
              {path.topics.map((t) => (
                <span key={t} className="learning-env-topic-tag">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
