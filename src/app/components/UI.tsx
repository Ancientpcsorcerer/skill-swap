import { useId, type ReactNode } from 'react';
import { Icon } from './Icon';
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <div className="section-header"><h2>{title}</h2>{action && <button className="quiet-button" onClick={onAction}>{action} <span aria-hidden="true">&rarr;</span></button>}</div>; }
export function Tags({ values }: { values: readonly string[] }) { return <div className="skill-tags">{values.map(value => <span key={value}>{value}</span>)}</div>; }
export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) { return <section className="workspace-panel"><h2>{title}</h2>{description && <p className="panel-description">{description}</p>}{children}</section>; }
export function Tabs({ values, value, onChange, label }: { values: readonly string[]; value: string; onChange: (value: string) => void; label: string }) {
  const id = useId();
  return <div className="pill-tabs" role="tablist" aria-label={label}>{values.map((item, index) => <button id={id + index} key={item} type="button" role="tab" aria-selected={value === item} tabIndex={value === item ? 0 : -1} onClick={() => onChange(item)} onKeyDown={event => { if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? values.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + values.length) % values.length; onChange(values[next]); document.getElementById(id + next)?.focus(); }}>{item}</button>)}</div>;
}
export function FilterControl({ value, onChange, options, label = 'Filter by category' }: { value: string; onChange: (value: string) => void; options: readonly string[]; label?: string }) {
  return <label className="filter-control" title={label}><Icon name="filter" /><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>{['All',...options].map(option => <option key={option}>{option}</option>)}</select></label>;
}
