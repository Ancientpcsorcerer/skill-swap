interface Props { progress: number; active: boolean; available: boolean }

export function ConnectCheckpoint({ progress }: Props) {
  return (
    <section
      id="connect-checkpoint"
      className="core-checkpoint connect-checkpoint"
      aria-label="Connect checkpoint"
      data-cinematic-disabled="true"
      data-core-progress={progress.toFixed(6)}
      data-loading="false"
      data-frame-error="false"
    />
  );
}
