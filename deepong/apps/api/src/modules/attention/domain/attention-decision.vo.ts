/**
 * AttentionDecision Value Object
 *
 * AttentionPolicyEvaluator의 출력값. 메시지 1건이 수신자에게 어떻게 전달될지 결정한다.
 *
 *  - IMMEDIATE: 즉시 알림(소리·진동)
 *  - IMMEDIATE_QUIET: 즉시 발송하되 소리 없이 (FOCUS 중 URGENT)
 *  - BATCHED: 다음 휴식 시간에 모아서 (scheduledAt 시각)
 *  - QUEUED: 알림 없이 대기열에만 (피드에서 따라잡기)
 *  - DROPPED: 전혀 전달하지 않음 (예: OFF + SHARE 조합, 차단)
 *
 *  스키마 NOTIFICATION.DELIVERY_METHOD 컬럼은 IMMEDIATE/BATCHED/QUEUED/DROPPED.
 *  IMMEDIATE_QUIET은 IMMEDIATE + quiet 플래그 조합으로 저장한다.
 */
export type DeliveryMethod = 'IMMEDIATE' | 'BATCHED' | 'QUEUED' | 'DROPPED';

export class AttentionDecision {
  private constructor(
    public readonly method: DeliveryMethod,
    /** FOCUS 중 URGENT 같은 조용한 즉시 발송 모드 */
    public readonly quiet: boolean = false,
    /** BATCHED일 때 발송 예정 시각 */
    public readonly scheduledAt: Date | null = null,
    /** 디버깅/로그용 사유 */
    public readonly reason: string = '',
  ) {}

  static immediate(reason = ''): AttentionDecision {
    return new AttentionDecision('IMMEDIATE', false, null, reason);
  }

  static immediateQuiet(reason = ''): AttentionDecision {
    return new AttentionDecision('IMMEDIATE', true, null, reason);
  }

  static batched(scheduledAt: Date, reason = ''): AttentionDecision {
    return new AttentionDecision('BATCHED', false, scheduledAt, reason);
  }

  static queued(reason = ''): AttentionDecision {
    return new AttentionDecision('QUEUED', false, null, reason);
  }

  static dropped(reason = ''): AttentionDecision {
    return new AttentionDecision('DROPPED', false, null, reason);
  }

  isImmediate(): boolean {
    return this.method === 'IMMEDIATE';
  }

  isBatched(): boolean {
    return this.method === 'BATCHED';
  }

  isQueued(): boolean {
    return this.method === 'QUEUED';
  }

  isDropped(): boolean {
    return this.method === 'DROPPED';
  }

  isQuiet(): boolean {
    return this.quiet;
  }
}
