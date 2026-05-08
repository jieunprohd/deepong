import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../domain/notification.entity';
import { PresenceSnapshot } from '../domain/presence-snapshot.entity';
import { NotificationPreference } from '../domain/notification-preference.entity';
import { Presence, PresenceType } from '../domain/presence.vo';
import { Tone, ToneType } from '../domain/tone.vo';
import { AttentionPolicyEvaluator } from '../domain/services/attention-policy-evaluator';
import { NotificationResponse } from './dto/notification.dto';

export interface EvaluateNotificationCommand {
  /** 알림 수신자 */
  recipientUserId: number;
  /** 트리거된 메시지 ID (Communication 컨텍스트의 MESSAGE.ID) */
  messageId: number;
  /** 메시지 톤 */
  tone: ToneType;
  /** 보낸 사람이 우선 친구인가 (Relationship.CommunicationNorm.isPriority) */
  isPriorityFriend?: boolean;
  /** 보낸 사람이 차단/뮤트되어 있는가 */
  isMuted?: boolean;
}

/**
 * 메시지 1건에 대한 알림 정책 평가 + Notification 생성.
 *
 *  Communication.MessageSent 이벤트 핸들러가 이 UseCase를 호출하여 사용한다.
 *  (현재 Communication 컨텍스트는 미구현이므로 외부에서 직접 호출 가능 형태로 노출)
 */
@Injectable()
export class EvaluateNotificationUseCase {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async execute(
    cmd: EvaluateNotificationCommand,
  ): Promise<NotificationResponse> {
    const { presence, allowUrgentInFocus, batchIntervalMin } =
      await this.loadContext(cmd.recipientUserId);

    const decision = AttentionPolicyEvaluator.decide({
      presence,
      tone: Tone.from(cmd.tone),
      isPriorityFriend: cmd.isPriorityFriend ?? false,
      isMuted: cmd.isMuted ?? false,
      allowUrgentInFocus,
      batchIntervalMin,
    });

    const notification = Notification.fromDecision({
      userId: cmd.recipientUserId,
      messageId: cmd.messageId,
      decision,
      tone: cmd.tone,
      presence: presence.value,
    });
    await notification.save();

    for (const event of notification.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return NotificationResponse.from(notification);
  }

  private async loadContext(userId: number): Promise<{
    presence: Presence;
    allowUrgentInFocus: boolean;
    batchIntervalMin: number;
  }> {
    const [snapshot, pref] = await Promise.all([
      PresenceSnapshot.findOne({ where: { userId } }),
      NotificationPreference.findOne({ where: { userId } }),
    ]);

    const presenceValue: PresenceType = snapshot?.lastStatus ?? 'OFF';
    return {
      presence: Presence.from(presenceValue),
      allowUrgentInFocus: pref?.allowUrgentInFocus ?? true,
      batchIntervalMin: pref?.batchIntervalMin ?? 120,
    };
  }
}
