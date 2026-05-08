import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PresenceSnapshot } from '../domain/presence-snapshot.entity';
import { Presence } from '../domain/presence.vo';
import { UpdatePresenceDto, PresenceResponse } from './dto/presence.dto';

@Injectable()
export class UpdatePresenceUseCase {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public async execute(
    userId: number,
    dto: UpdatePresenceDto,
  ): Promise<PresenceResponse> {
    const snapshot = await this.findOrCreate(userId);
    snapshot.changeTo(Presence.from(dto.status));
    await snapshot.save();

    for (const event of snapshot.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }

    return PresenceResponse.from(snapshot);
  }

  private async findOrCreate(userId: number): Promise<PresenceSnapshot> {
    const existing = await PresenceSnapshot.findOne({ where: { userId } });
    return existing ?? PresenceSnapshot.initial(userId);
  }
}
