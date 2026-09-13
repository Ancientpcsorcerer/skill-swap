import { navigate } from '../../app/navigation';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { content } from '../../data/content';
import { useModalDialog } from '../../hooks/useModalDialog';
import { BrandMark } from '../ui/BrandMark';

interface Props {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

// Future authentication UI mounts in children. Opening/closing never traverses the Frame.
export function SignupModal({ open, onClose, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useModalDialog(dialog, open);

  return (
    <dialog ref={dialog} id="signup-modal" className="signup-modal" aria-labelledby="signup-title"
      aria-describedby="signup-description"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClose={onClose}
      onClick={event => { if (event.target === dialog.current) onClose(); }}>
      <div className="signup-panel">
        <button className="icon-button modal-close" type="button" aria-label="Close signup" onClick={onClose} autoFocus>
          <span aria-hidden="true">×</span>
        </button>
        <BrandMark className="signup-mark" />
        <h2 id="signup-title">{content.signupTitle}</h2>
        <p id="signup-description">{content.signupDescription}</p>
        {children ?? <><button type="button" className="pill signup-dismiss" onClick={() => navigate('signup')}>Create account</button> <button type="button" className="pill signup-dismiss" onClick={onClose}>Keep exploring</button></>}
      </div>
    </dialog>
  );
}
