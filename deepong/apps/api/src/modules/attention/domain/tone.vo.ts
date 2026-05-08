/**
 * Tone Value Object
 *
 * 메시지의 의도/긴급도. Communication 컨텍스트의 핵심 개념이지만,
 * Attention 정책 평가의 입력값으로 동등하게 사용된다.
 *
 *  - CHAT: 가벼운 수다, 모아서 전달
 *  - ASK: 답이 필요한 질문, FREE/WORKING에서 즉시
 *  - URGENT: 빠른 확인이 필요한 일, FOCUS에서도 조용히 즉시
 *  - SHARE: 링크/이미지/파일, 모아서 전달
 *
 * Communication 컨텍스트에서도 동일 정의를 쓸 수 있도록 Attention에 1차 정의.
 */
export type ToneType = 'CHAT' | 'ASK' | 'URGENT' | 'SHARE';

const ALL_TONES: ReadonlyArray<ToneType> = [
  'CHAT',
  'ASK',
  'URGENT',
  'SHARE',
] as const;

export class Tone {
  private constructor(public readonly value: ToneType) {}

  static chat(): Tone {
    return new Tone('CHAT');
  }

  static ask(): Tone {
    return new Tone('ASK');
  }

  static urgent(): Tone {
    return new Tone('URGENT');
  }

  static share(): Tone {
    return new Tone('SHARE');
  }

  static from(value: string): Tone {
    const normalized = value?.toUpperCase() as ToneType;
    if (!ALL_TONES.includes(normalized)) {
      throw new Error(`Invalid tone value: ${value}`);
    }
    return new Tone(normalized);
  }

  isUrgent(): boolean {
    return this.value === 'URGENT';
  }

  isAsk(): boolean {
    return this.value === 'ASK';
  }

  /** 집중 모드를 뚫고 즉시 알림이 가능한 톤 */
  canBypassFocus(): boolean {
    return this.value === 'URGENT';
  }

  /** 일일 쿼터 소비가 필요한 톤 (URGENT 제한) */
  requiresQuota(): boolean {
    return this.value === 'URGENT';
  }

  equals(other: Tone): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
