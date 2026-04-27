import {User} from "@modules/identity/domain/user.entity";

export class FindUserResponse {
    user: {
        id: number;
        nickname: string;
        handle: string;
        avatarUrl: string;
    }

    public static from(user: User) {
        const response = new FindUserResponse();
        
        response.user = {
            id: user.id,
            nickname: user.nickname,
            handle: user.handle,
            avatarUrl: user.avatarUrl
        }

        return response;
    }
}