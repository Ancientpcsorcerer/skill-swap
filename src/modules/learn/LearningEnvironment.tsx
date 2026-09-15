import { useState, useEffect } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { useAuthGate } from '../../app/session/AuthGateContext';
import { navigate } from '../../app/navigation';
import type { LearningPath } from '../../app/data/models';
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
  const [progress, setProgress] = useState(record?.progress || 0);
  const [status, setStatus] = useState<'In Progress' | 'Saved' | 'Completed'>(
    record?.status || 'In Progress'
  );
  const [savedNotice, setSavedNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setProgress(record.progress);
      setStatus(record.status);
    }
  }, [record]);

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
    <div className="learning-environment-container" style={{
      background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.95) 0%, rgba(10, 13, 24, 0.98) 100%)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '2rem',
      color: '#f8fafc',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
    }}>
      {/* Top Bar Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="quiet-button"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#94a3b8' }}
        >
          &larr; Back to Learning Hub
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: status === 'Completed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
            color: status === 'Completed' ? '#4ade80' : '#a5b4fc',
            border: '1px solid currentColor',
          }}>
            {status} ({progress}%)
          </span>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '2rem' }}>
        {/* Left Column: Curriculum & Milestones */}
        <div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <Artwork art={path.art} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8', fontWeight: 600 }}>
                {path.category} &bull; {path.resources} Interactive Units
              </span>
              <h1 style={{ fontSize: '1.8rem', margin: '6px 0 10px', fontWeight: 700 }}>{path.title}</h1>
              <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>{path.description}</p>
            </div>
          </div>

          {/* Interactive Progress Bar & Slider */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '2rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Track Progress</span>
              <span style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 0.3s ease' }} />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleSaveProgress(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#6366f1' }}
            />
            {savedNotice && (
              <small style={{ display: 'block', marginTop: '6px', color: '#34d399', fontSize: '0.75rem' }}>
                {savedNotice}
              </small>
            )}
          </div>

          {/* Curriculum Milestones */}
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600 }}>Curriculum Milestones</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {milestones.map((m, idx) => {
              const stepPercent = (idx + 1) * 25;
              const isChecked = progress >= stepPercent;
              return (
                <div
                  key={m.title}
                  onClick={() => handleSaveProgress(isChecked ? idx * 25 : stepPercent)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '1rem',
                    borderRadius: '10px',
                    background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isChecked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    style={{ marginTop: '4px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                  <div>
                    <strong style={{ display: 'block', color: isChecked ? '#e0e7ff' : '#f1f5f9', fontSize: '0.95rem' }}>
                      {idx + 1}. {m.title}
                    </strong>
                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.4' }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Mentor Reciprocity & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Actions Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600 }}>Track Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleSaveProgress(100, 'Completed')}
                disabled={isSaving || progress === 100}
                style={{ width: '100%', padding: '10px' }}
              >
                {progress === 100 ? '✓ Path Completed' : 'Complete All Units (100%)'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleSaveProgress(progress, 'Saved')}
                style={{ width: '100%', padding: '10px' }}
              >
                Save for Later
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate('connect', undefined, false, { skill: path.topics[0] })}
                style={{ width: '100%', padding: '10px' }}
              >
                Find Practice Partner &rarr;
              </button>
            </div>
          </div>

          {/* Topics Tag Deck */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>Topics & Competencies</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {path.topics.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#e2e8f0',
                  }}
                >
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
