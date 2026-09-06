import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Field = ({ label, hint, error, id, className, ...rest }: FieldProps) => {
  const fieldId = id ?? `f-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        className={[styles.input, error ? styles.invalid : ''].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <span id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fieldId}-err`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextArea = ({ label, hint, error, id, className, ...rest }: TextAreaProps) => {
  const fieldId = id ?? `t-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className={[styles.field, className ?? ''].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        id={fieldId}
        className={[styles.textarea, error ? styles.invalid : ''].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-err` : hint ? `${fieldId}-hint` : undefined}
        rows={3}
        {...rest}
      />
      {hint && !error && (
        <span id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fieldId}-err`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
