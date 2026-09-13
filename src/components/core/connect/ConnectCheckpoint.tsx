import { ConnectEnvironment } from '../ConnectEnvironment';
interface Props { progress: number; active: boolean; available: boolean }
// Frame playback is intentionally retired. Preserve the existing checkpoint range
// and static master environment; no substitute sequence or renderer is created.
export function ConnectCheckpoint({ progress }: Props) {
  return <section id="connect-checkpoint" className="core-checkpoint connect-checkpoint" aria-label="Architectural environment"
    data-cinematic-disabled="true" data-core-progress={progress.toFixed(6)} data-loading="false" data-frame-error="false">
    <ConnectEnvironment />
  </section>;
}
