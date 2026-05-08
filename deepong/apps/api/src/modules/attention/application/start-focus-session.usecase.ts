import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsNull } from 'typeorm';
import { FocusSession } from '../domain/focus-session.entity';
import { PresenceSnapshot } from '../domain/presence-snapshot.entity';
import { Presence } from '../domain/presence.vo';
import {
  StartFocusSessionDto,
  FocusSessionResponse,
} from './dto/focus-session.dto';

@Injectable()
export class StartFocusSessionUseCase {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async execute(
    userId: number,
    dto: StartFocusSessionDto,
  ): Promise<FocusSessionResponse> {
    await this.ensureNoActiveSession(userId);

    const session = FocusSession.start({
      userId,
      plannedMinutes: dto.plannedMinutes,
      sessionType: dto.sessionType,
      taskName: dto.taskName ?? null,
    });
    await session.save();

    // 프레즌스 자동 전환: FOCUS
    await this.changePresenceToFocus(userId);

    for (const event of session.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return FocusSessionResponse.from(session);
  }

  private async ensureNoActiveSession(userId: number): Promise<void> {
    const active = await FocusSession.findOne({
      where: { userId, endedAt: IsNull() },
    });
    if (active) {
      throw new ConflictException(
        '이미 진행 중인 집중 세션이 있습니다. 먼저 종료해 주세요.',
      );
    }
  }

  private async changePresenceToFocus(userId: number): Promise<void> {
    const snapshot =
      (await PresenceSnapshot.findOne({ where: { userId } })) ??
      PresenceSnapshot.initial(userId);
    snapshot.changeTo(Presence.focus());
    await snapshot.save();

    for (const event of snapshot.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }
}
