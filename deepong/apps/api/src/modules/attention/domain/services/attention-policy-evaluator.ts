import { Presence } from '../presence.vo';
import { Tone } from '../tone.vo';
import { AttentionDecision } from '../attention-decision.vo';

/**
 * AttentionPolicyEvaluator (Domain Service)
 *
 * 메시지 1건의 (수신자 프레즌스, 톤, 친구 관계 norm, 사용자 환경설정)을 입력받아
 * AttentionDecision (전달 방식 + 시각)을 결정한다. 부수효과 없음, 순수 함수.
 *
 *  | 수신자 \ 톤 | CHAT        | ASK       | URGENT          | SHARE       |
 *  |-----------|-------------|-----------|-----------------|-------------|
 *  | FREE      | IMMEDIATE   | IMMEDIATE | IMMEDIATE       | IMMEDIATE   |
 *  | WORKING   | BATCHED(2h) | IMMEDIATE | IMMEDIATE       | BATCHED(2h) |
 *  | FOCUS     | QUEUED      | QUEUED    | IMMEDIATE_QUIET | QUEUED      |
 *  | OFF       | QUEUED      | QUEUED    | IMMEDIATE       | DROPPED     |
 *
 * 친구 관계 Norm 오버라이드:
 *  - isMuted: 모든 결과를 DROPPED로 강제
 *  - isPriorityFriend: FOCUS 중에도 IMMEDIATE (URGENT가 아니어도)
 *
 * 사용자 환경설정 오버라이드:
 *  - allowUrgentInFocus=false: FOCUS 중 URGENT는 QUEUED로 다운그레이드
 */
export interface PolicyInput {
  presence: Presence;
  tone: Tone;
  /** 보낸 사람이 우선 친구인지 (Relationship.CommunicationNorm.isPriority) */
  isPriorityFriend?: boolean;
  /** 보낸 사람이 차단/뮤트 됐는지 */
  isMuted?: boolean;
  /** 사용자 환경설정에서 FOCUS 중 URGENT 허용 여부 */
  allowUrgentInFocus?: boolean;
  /** BATCHED 알림 모음 주기 (분) */
  batchIntervalMin?: number;
  /** 평가 기준 시각. 테스트 가능성을 위해 주입 */
  now?: Date;
}

export class AttentionPolicyEvaluator {
  static decide(input: PolicyInput): AttentionDecision {
    const {
      presence,
      tone,
      isPriorityFriend = false,
      isMuted = false,
      allowUrgentInFocus = true,
      batchIntervalMin = 120,
      now = new Date(),
    } = input;

    // 1) 차단/뮤트는 다른 모든 규칙보다 먼저 적용
    if (isMuted) {
      return AttentionDecision.dropped('muted');
    }

    // 2) 우선 친구는 FOCUS 게이트를 통과한다 (URGENT가 아니어도 IMMEDIATE)
    if (isPriorityFriend && presence.isFocus()) {
      return AttentionDecision.immediate('priority-friend-in-focus');
    }

    // 3) 프레즌스별 매트릭스
    if (presence.isFree()) {
      return AttentionDecision.immediate('free');
    }

    if (presence.isWorking()) {
      // WORKING: ASK/URGENT만 즉시, 나머지는 모아서
      if (tone.value === 'ASK' || tone.value === 'URGENT') {
        return AttentionDecision.immediate('working-priority-tone');
      }
      return AttentionDecision.batched(
        scheduleNext(now, batchIntervalMin),
        'working-batched',
      );
    }

    if (presence.isFocus()) {
      if (tone.value === 'URGENT') {
        if (allowUrgentInFocus) {
          return AttentionDecision.immediateQuiet('focus-urgent-quiet');
        }
        return AttentionDecision.queued('focus-urgent-suppressed');
      }
      return AttentionDecision.queued('focus');
    }

    // OFF
    if (tone.value === 'URGENT') {
      return AttentionDecision.immediate('off-urgent');
    }
    if (tone.value === 'SHARE') {
      return AttentionDecision.dropped('off-share');
    }
    return AttentionDecision.queued('off');
  }
}

function scheduleNext(now: Date, intervalMin: number): Date {
  return new Date(now.getTime() + intervalMin * 60_000);
}
