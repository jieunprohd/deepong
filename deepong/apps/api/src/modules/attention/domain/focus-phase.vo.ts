/**
 * FocusPhase Value Object
 *
 * 뽀모도로/집중 세션의 단계.
 *  - FOCUS: 집중 작업 구간
 *  - SHORT_BREAK: 짧은 휴식 (보통 5분)
 *  - LONG_BREAK: 긴 휴식 (4사이클마다)
 */
export type FocusPhaseType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

const ALL_PHASES: ReadonlyArray<FocusPhaseType> = [
  'FOCUS',
  'SHORT_BREAK',
  'LONG_BREAK',
] as const;

export class FocusPhase {
  private constructor(public readonly value: FocusPhaseType) {}

  static focus(): FocusPhase {
    return new FocusPhase('FOCUS');
  }

  static shortBreak(): FocusPhase {
    return new FocusPhase('SHORT_BREAK');
  }

  static longBreak(): FocusPhase {
    return new FocusPhase('LONG_BREAK');
  }

  static from(value: string): FocusPhase {
    const normalized = value?.toUpperCase() as FocusPhaseType;
    if (!ALL_PHASES.includes(normalized)) {
      throw new Error(`Invalid focus phase value: ${value}`);
    }
    return new FocusPhase(normalized);
  }

  isFocus(): boolean {
    return this.value === 'FOCUS';
  }

  isBreak(): boolean {
    return this.value === 'SHORT_BREAK' || this.value === 'LONG_BREAK';
  }

  equals(other: FocusPhase): boolean {
    return this.value === other.value;
  }
}
