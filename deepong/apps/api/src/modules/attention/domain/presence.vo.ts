/**
 * Presence Value Object
 *
 * 사용자의 현재 응대 가능 상태.
 *  - FREE: 여유, 즉시 응답 가능
 *  - WORKING: 일하는 중, 급한 메시지만 즉시 알림
 *  - FOCUS: 집중 모드, 알림은 조용히 대기열로 (URGENT만 예외)
 *  - OFF: 오프라인/자리비움
 *
 * 실시간 상태는 Redis에 보관, DB 스냅샷(`PresenceSnapshot`)은 마지막 관측치만 기록.
 */
export type PresenceType = 'FREE' | 'WORKING' | 'FOCUS' | 'OFF';

const ALL_PRESENCES: ReadonlyArray<PresenceType> = [
  'FREE',
  'WORKING',
  'FOCUS',
  'OFF',
] as const;

export class Presence {
  private constructor(public readonly value: PresenceType) {}

  static free(): Presence {
    return new Presence('FREE');
  }

  static working(): Presence {
    return new Presence('WORKING');
  }

  static focus(): Presence {
    return new Presence('FOCUS');
  }

  static off(): Presence {
    return new Presence('OFF');
  }

  static from(value: string): Presence {
    const normalized = value?.toUpperCase() as PresenceType;
    if (!ALL_PRESENCES.includes(normalized)) {
      throw new Error(`Invalid presence value: ${value}`);
    }
    return new Presence(normalized);
  }

  isFree(): boolean {
    return this.value === 'FREE';
  }

  isWorking(): boolean {
    return this.value === 'WORKING';
  }

  isFocus(): boolean {
    return this.value === 'FOCUS';
  }

  isOff(): boolean {
    return this.value === 'OFF';
  }

  /** 즉시 응답 가능한 상태인지 */
  isAvailableImmediately(): boolean {
    return this.isFree();
  }

  equals(other: Presence): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
