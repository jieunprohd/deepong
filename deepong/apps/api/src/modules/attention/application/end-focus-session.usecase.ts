import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FocusSession } from '../domain/focus-session.entity';
import { PresenceSnapshot } from '../domain/presence-snapshot.entity';
import { Presence } from '../domain/presence.vo';
import {
  EndFocusSessionDto,
  FocusSessionResponse,
} from './dto/focus-session.dto';

@Injectable()
export class EndFocusSessionUseCase {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async execute(
    userId: number,
    sessionId: number,
    dto: EndFocusSessionDto,
  ): Promise<FocusSessionResponse> {
    const session = await FocusSession.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('집중 세션을 찾을 수 없습니다.');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('본인 세션만 종료할 수 있습니다.');
    }

    const completed =
      dto.completed ??
      session.actualMinutes() >= session.plannedMinutes;

    session.end(new Date(), completed);
    await session.save();

    // 프레즌스 자동 전환: FREE
    await this.changePresenceToFree(userId);

    for (const event of session.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return FocusSessionResponse.from(session);
  }

  private async changePresenceToFree(userId: number): Promise<void> {
    const snapshot =
      (await PresenceSnapshot.findOne({ where: { userId } })) ??
      PresenceSnapshot.initial(userId);
    snapshot.changeTo(Presence.free());
    await snapshot.save();

    for (const event of snapshot.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }
}
