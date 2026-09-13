import type { Ref } from 'react';
export function SearchIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
export function SearchField({ value, onChange, inputRef, label, placeholder }: {
  value: string; onChange: (value: string) => void; inputRef?: Ref<HTMLInputElement>; label: string; placeholder: string;
}) {
  return <div className="workspace-search"><SearchIcon />
    <input ref={inputRef} type="search" aria-label={label} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    {value && <button type="button" className="workspace-text-button" onClick={() => onChange('')} aria-label="Clear search">Clear</button>}
  </div>;
}
