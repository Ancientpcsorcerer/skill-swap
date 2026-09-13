import { useEffect, useRef, useState, type ReactNode } from 'react';
export function Dropdown({ label, trigger, items }: { label: string; trigger: ReactNode; items: { label: string; action: () => void }[] }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; root.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <div className="workspace-dropdown" ref={root} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); button.current?.focus(); }
    if (open && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)) { event.preventDefault(); const nodes = Array.from(root.current!.querySelectorAll<HTMLButtonElement>('[role=menuitem]')); const current = nodes.indexOf(document.activeElement as HTMLButtonElement); const index = event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length-1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + nodes.length) % nodes.length; nodes[index]?.focus(); }
    if (event.key === 'Tab') setOpen(false);
  }}><button ref={button} type="button" className="dropdown-trigger" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>{trigger}</button>
    {open && <div className="dropdown-menu" role="menu" aria-label={label}>{items.map(item => <button key={item.label} type="button" role="menuitem" onClick={() => { setOpen(false); button.current?.focus(); item.action(); }}>{item.label}</button>)}</div>}
  </div>;
}
