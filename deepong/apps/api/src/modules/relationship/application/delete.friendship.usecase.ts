import {Injectable, NotFoundException} from "@nestjs/common";
import {Friendship} from "@modules/relationship/domain/friendship.entity";
import {EventEmitter2} from "@nestjs/event-emitter";

@Injectable()
export class DeleteFriendshipUseCase {
    constructor(private readonly eventEmitter: EventEmitter2) {
    }

    public async execute(
        userId: number,
        friendshipId: number
    ) {
        const friendship = await this.findFriendshipById(friendshipId);
        friendship.markRemove(userId);
        await friendship.save();

        for (const event of friendship.pullDomainEvents()) {
            this.eventEmitter.emit(event.eventName, event);
        }
    }

    private async findFriendshipById(friendshipId: number) {
        const friendship = await Friendship.findOne({
            where: {
                id: friendshipId
            }
        });

        if (!friendship) {
            throw new NotFoundException('친구 관계가 존재하지 않습니다.');
        }

        return friendship;
    }
}
