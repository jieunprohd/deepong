import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { Friendship } from '@modules/relationship/domain/friendship.entity';
import { CommunicationNorm } from '@modules/relationship/domain/communication-norm.entity';

@Injectable()
export class DeleteFriendshipUseCase {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  public async execute(userId: number, friendshipId: number): Promise<void> {
    const friendship = await this.findFriendshipById(friendshipId);
    friendship.markRemove(userId);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(Friendship, friendship);
      await manager.delete(CommunicationNorm, {
        ownerUserId: friendship.requesterUserId,
        friendUserId: friendship.addresseeUserId,
      });
      await manager.delete(CommunicationNorm, {
        ownerUserId: friendship.addresseeUserId,
        friendUserId: friendship.requesterUserId,
      });
    });

    for (const event of friendship.pullDomainEvents()) {
      this.eventEmitter.emit(event.eventName, event);
    }
  }

  private async findFriendshipById(friendshipId: number): Promise<Friendship> {
    const friendship = await Friendship.findOne({ where: { id: friendshipId } });
    if (!friendship) throw new NotFoundException('친구 관계가 존재하지 않습니다.');
    return friendship;
  }
}
