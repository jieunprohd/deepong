export type ToneType = 'CHAT' | 'ASK' | 'URGENT' | 'SHARE';

export class Tone {
  private constructor(readonly value: ToneType) {}

  static chat(): Tone { return new Tone('CHAT'); }
  static ask(): Tone { return new Tone('ASK'); }
  static urgent(): Tone { return new Tone('URGENT'); }
  static share(): Tone { return new Tone('SHARE'); }
  static from(value: ToneType): Tone { return new Tone(value); }

  requiresQuota(): boolean { return this.value === 'URGENT'; }
  equals(other: Tone): boolean { return this.value === other.value; }
}
