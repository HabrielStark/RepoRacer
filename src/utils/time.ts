export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function makeRunId(date = new Date()): string {
  const stamp = date.toISOString().replace(/[-:]/g, "").replace(".", "-").replace("T", "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `run-${stamp}-${suffix}`;
}
