import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ToneType } from '../domain/tone.vo';
import { CommunicationAcl } from '../infrastructure/acl/communication.acl';
import { RelationshipAcl } from '../infrastructure/acl/relationship.acl';
import { EvaluateNotificationUseCase } from './evaluate-notification.usecase';

interface MessageSentEventPayload {
  aggregateId: number;
  roomId: number;
  senderUserId: number;
  tone: string;
  seq: number;
  content: string;
  sentAt: Date;
}

/**
 * Communication.MessageSent 이벤트 수신.
 *
 * 1) 방의 활성 멤버 중 발신자를 제외한 수신자 목록을 ACL로 조회
 * 2) 각 수신자별로 Relationship Norm을 ACL로 조회
 * 3) EvaluateNotificationUseCase 실행 (한 명 실패가 다른 수신자를 막지 않도록 격리)
 */
@Injectable()
export class MessageSentHandler {
  private readonly logger = new Logger(MessageSentHandler.name);

  constructor(
    private readonly evaluateUC: EvaluateNotificationUseCase,
    private readonly communicationAcl: CommunicationAcl,
    private readonly relationshipAcl: RelationshipAcl,
  ) {}

  @OnEvent('MessageSentEvent', { async: true, promisify: true })
  async handle(event: MessageSentEventPayload): Promise<void> {
    const { aggregateId: messageId, roomId, senderUserId, tone } = event;

    const recipientIds = await this.communicationAcl.getRoomMemberIds(
      roomId,
      senderUserId,
    );
    if (!recipientIds.length) return;

    await Promise.all(
      recipientIds.map(async (recipientUserId) => {
        try {
          const norm = await this.relationshipAcl.getNormFor(
            recipientUserId,
            senderUserId,
          );
          await this.evaluateUC.execute({
            recipientUserId,
            messageId,
            tone: tone as ToneType,
            isPriorityFriend: norm.isPriorityFriend,
            isMuted: norm.isMuted,
          });
        } catch (err) {
          this.logger.error(
            `알림 평가 실패 (messageId=${messageId} recipient=${recipientUserId}): ${err instanceof Error ? err.message : String(err)}`,
            err instanceof Error ? err.stack : undefined,
          );
        }
      }),
    );
  }
}
