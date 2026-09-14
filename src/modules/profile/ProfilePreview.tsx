import { useRef, type ReactNode } from 'react';
import { Avatar } from '../../app/components/Avatar';
import { useModalDialog } from '../../hooks/useModalDialog';
import { navigate } from '../../app/navigation';

export interface ProfileSummary {
  id: string;
  name: string;
  skills: readonly string[];
  interests: readonly string[];
  description: string;
}

export function ProfilePreview({
  person,
  onClose,
  action,
}: {
  person: ProfileSummary | null;
  onClose: () => void;
  action?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useModalDialog(dialog, person !== null);

  return (
    <dialog
      ref={dialog}
      className="workspace-dialog"
      aria-labelledby="profile-preview-title"
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
          className="workspace-text-button workspace-dialog-close"
          onClick={onClose}
          autoFocus
        >
          Close
        </button>
        {person && (
          <>
            <Avatar name={person.name} />
            <p className="workspace-eyebrow">PROFILE PREVIEW</p>
            <h2 id="profile-preview-title">{person.name}</h2>
            <p className="profile-preview-skills">{person.skills.join(' \u00b7 ')}</p>
            <p>{person.description}</p>
            <h3>Interests</h3>
            <p>{person.interests.join(' \u00b7 ')}</p>
            <div className="profile-preview-action">
              {action}
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  onClose();
                  navigate('profile', undefined, false, { user: person.id });
                }}
              >
                View Full Profile &rarr;
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
