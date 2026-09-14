import { useRef, useState, useEffect } from 'react';
import { Artwork } from '../../app/components/Artwork';
import { useModalDialog } from '../../hooks/useModalDialog';
import { useAuthGate } from '../../app/session/AuthGateContext';
import type { LearningPath } from '../../app/data/models';
import type { NormalizedLearningRecord } from './useLearnState';

interface LearningDetailModalProps {
  path: LearningPath | null;
  onClose: () => void;
  records: NormalizedLearningRecord[];
  onUpdateRecord: (
    pathId: string,
    status: 'In Progress' | 'Saved' | 'Completed',
    progress: number
  ) => Promise<unknown>;
  onStartSuccess: () => void;
}

export function LearningDetailModal({
  path,
  onClose,
  records,
  onUpdateRecord,
  onStartSuccess,
}: LearningDetailModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { requireAuth } = useAuthGate();
  useModalDialog(dialog, !!path);

  const existingRecord = path ? records.find((r) => r.pathId === path.id) : null;
  const isSaved = existingRecord?.status === 'Saved';
  const isInProgress = existingRecord?.status === 'In Progress';
  const isCompleted = existingRecord?.status === 'Completed';

  const [sliderProgress, setSliderProgress] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [progressSavedNotice, setProgressSavedNotice] = useState<string>('');

  useEffect(() => {
    if (existingRecord) {
      setSliderProgress(existingRecord.progress);
    } else {
      setSliderProgress(0);
    }
    setProgressSavedNotice('');
  }, [existingRecord, path]);

  if (!path) return null;
  const activePath = path;

  async function handleSavePath() {
    if (
      !requireAuth('save this learning path', async () => {
        setIsUpdating(true);
        await onUpdateRecord(activePath.id, 'Saved', sliderProgress);
        setIsUpdating(false);
      })
    ) {
      return;
    }
    setIsUpdating(true);
    await onUpdateRecord(activePath.id, 'Saved', sliderProgress);
    setIsUpdating(false);
  }

  async function handleStartLearning() {
    if (
      !requireAuth('start learning this path', async () => {
        setIsUpdating(true);
        await onUpdateRecord(activePath.id, 'In Progress', sliderProgress || 0);
        setIsUpdating(false);
        onStartSuccess();
        onClose();
      })
    ) {
      return;
    }
    setIsUpdating(true);
    await onUpdateRecord(activePath.id, 'In Progress', sliderProgress || 0);
    setIsUpdating(false);
    onStartSuccess();
    onClose();
  }

  async function handleMarkCompleted() {
    if (
      !requireAuth('mark this path completed', async () => {
        setIsUpdating(true);
        await onUpdateRecord(activePath.id, 'Completed', 100);
        setIsUpdating(false);
        onClose();
      })
    ) {
      return;
    }
    setIsUpdating(true);
    await onUpdateRecord(activePath.id, 'Completed', 100);
    setIsUpdating(false);
    onClose();
  }

  async function handleUpdateSlider() {
    if (
      !requireAuth('update learning progress', async () => {
        setIsUpdating(true);
        await onUpdateRecord(activePath.id, existingRecord?.status || 'In Progress', sliderProgress);
        setIsUpdating(false);
        setProgressSavedNotice('Progress updated.');
        setTimeout(() => setProgressSavedNotice(''), 3000);
      })
    ) {
      return;
    }
    setIsUpdating(true);
    await onUpdateRecord(activePath.id, existingRecord?.status || 'In Progress', sliderProgress);
    setIsUpdating(false);
    setProgressSavedNotice('Progress updated.');
    setTimeout(() => setProgressSavedNotice(''), 3000);
  }

  return (
    <dialog
      className="workspace-dialog path-preview"
      ref={dialog}
      aria-labelledby="path-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="workspace-dialog-content">
        <button
          type="button"
          className="workspace-dialog-close quiet-button"
          onClick={onClose}
          autoFocus
        >
          Close
        </button>

        <Artwork art={path.art} />
        <h2 id="path-preview-title">{path.title}</h2>
        <p>
          {path.description}. Choose this as your learning focus and connect with practitioners who can help guide your craft.
        </p>
        <p>
          {path.resources} curated resources &middot; {path.mentorIds.length} active mentors
        </p>

        {/* Real Server Progress Slider */}
        {existingRecord && (
          <div className="progress-slider-control">
            <div className="progress-slider-header">
              <span>Verified Progress</span>
              <strong>{sliderProgress}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderProgress}
              onChange={(e) => setSliderProgress(Number(e.target.value))}
              className="progress-slider-input"
              aria-label="Adjust learning progress percentage"
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={handleUpdateSlider}
                disabled={isUpdating || sliderProgress === existingRecord.progress}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                Save Progress
              </button>
              {progressSavedNotice && (
                <span role="status" style={{ fontSize: '11px', color: '#235c2b' }}>
                  {progressSavedNotice}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Primary Enrollment and Status Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleSavePath}
            disabled={isUpdating}
          >
            {isSaved ? 'Saved' : 'Save path'}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleStartLearning}
            disabled={isUpdating}
          >
            {isInProgress ? 'Resume Learning' : 'Start Learning'}
          </button>
        </div>

        {existingRecord && (
          <button
            type="button"
            className="quiet-button"
            onClick={handleMarkCompleted}
            disabled={isUpdating || isCompleted}
            style={{ marginTop: '8px' }}
          >
            {isCompleted ? 'Path Completed' : 'Mark completed'}
          </button>
        )}

        {/* Capability-Aware Quiet Placeholders (Milestone Boundaries) */}
        <div className="capability-placeholder-box">
          <div className="capability-placeholder-header">
            <span className="capability-placeholder-title">Mentorship Sessions</span>
            <span className="capability-placeholder-tag">Future Milestone</span>
          </div>
          <p className="capability-placeholder-text">
            One-on-one video mentorship, time-slot scheduling, and verified calendar invites will be available in a dedicated upcoming milestone.
          </p>
        </div>

        <div className="capability-placeholder-box">
          <div className="capability-placeholder-header">
            <span className="capability-placeholder-title">Collaborative Craft Notes</span>
            <span className="capability-placeholder-tag">Future Milestone</span>
          </div>
          <p className="capability-placeholder-text">
            Shared workspace notebooks and synchronized progress checklists are scheduled for future backend expansion.
          </p>
        </div>
      </div>
    </dialog>
  );
}
