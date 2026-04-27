import {FriendshipStatus} from "@modules/relationship/domain/friendship.status.type";
import {Friendship} from "@modules/relationship/domain/friendship.entity";

export class FriendshipItem {
    id: number;
    peer: {
        id: number;
        nickname: string;
        handle: string;
        avatarUrl: string | null;
    };
    status: FriendshipStatus;
    acceptedAt: Date;

    public static from(friendship: Friendship, myUserId: number): FriendshipItem | null {
        const peerUser = friendship.getPeerUser(myUserId);
        if (!peerUser) return null;

        const item = new FriendshipItem();
        item.id = friendship.id;
        item.peer = {
            id: peerUser.id,
            nickname: peerUser.nickname,
            handle: peerUser.handle,
            avatarUrl: peerUser.avatarUrl,
        };
        item.status = friendship.status;
        item.acceptedAt = friendship.acceptedAt!;
        return item;
    }
}

export class FriendshipListResponse {
    items: FriendshipItem[];
    hasNext: boolean;
    nextCursor: string | null;

    public static from(
        friendships: Friendship[],
        myUserId: number,
        hasNext: boolean,
    ): FriendshipListResponse {
        const response = new FriendshipListResponse();

        response.items = friendships
            .map((f) => FriendshipItem.from(f, myUserId))
            .filter(Boolean);

        response.hasNext = hasNext;

        const last = friendships[friendships.length - 1];
        response.nextCursor = last?.acceptedAt
            ? last.acceptedAt.toISOString()
            : null;

        return response;
    }
}
