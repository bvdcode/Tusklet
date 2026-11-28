const chime = [
  { frequency: 523.25, offset: 0 },
  { frequency: 659.25, offset: 0.085 },
];
const noteDuration = 0.16;
const attackDuration = 0.012;
const peakGain = 0.055;

export default class TaskCompletionSound {
  private context?: AudioContext;
  private ready?: Promise<void>;

  prepare() {
    if (typeof AudioContext !== "function") {
      return;
    }
    try {
      const context = (this.context ??= new AudioContext());
      if (context.state !== "running") {
        this.ready = context.resume().catch(() => undefined);
      }
    } catch {
      this.context = undefined;
    }
  }

  async play() {
    const context = this.context;
    await this.ready;
    if (context !== this.context || context?.state !== "running") {
      return;
    }

    const onset = context.currentTime;
    for (const { frequency, offset } of chime) {
      const start = onset + offset;
      const end = start + noteDuration;
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(peakGain, start + attackDuration);
      envelope.gain.linearRampToValueAtTime(0, end);
      oscillator.connect(envelope).connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start);
      oscillator.stop(end);
    }
  }

  close() {
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.ready = undefined;
  }
}
