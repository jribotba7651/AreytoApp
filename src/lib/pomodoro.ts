export const WORK_DURATION_MS = 25 * 60 * 1000;
export const REST_DURATION_MS = 5 * 60 * 1000;

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function playPomodoroBeep(): void {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const now = ctx.currentTime;

  const beep = (startAt: number, frequency: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.3, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.4);
  };

  beep(now, 880);
  beep(now + 0.45, 660);

  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, 1200);
}
