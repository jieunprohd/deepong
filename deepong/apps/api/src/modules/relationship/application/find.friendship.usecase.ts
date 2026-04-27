import {Injectable} from "@nestjs/common";
import {Friendship} from "@modules/relationship/domain/friendship.entity";
import {FriendshipListResponse} from "./dto/friendship.list.response";

const PAGE_LIMIT = 20;

@Injectable()
export class FindFriendshipUsecase {
    public async execute(
        userId: number,
        cursor?: string,
    ): Promise<FriendshipListResponse> {
        const cursorDate = cursor ? new Date(cursor) : undefined;

        const [friendships, totalCount] = await Friendship.findFriendList(
            userId,
            cursorDate,
            PAGE_LIMIT + 1,
        );

        const hasNext = friendships.length > PAGE_LIMIT;
        if (hasNext) friendships.pop();

        return FriendshipListResponse.from(friendships, userId, hasNext);
    }
}
