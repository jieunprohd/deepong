import {User} from "@modules/identity/domain/user.entity";

export class AuthResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        nickname: string;
        handle: string;
        avatarUrl: string | null;
    };

    public static from(accessToken: string, refreshToken: string, user: User): AuthResult {
        const authResult = new AuthResult();
        authResult.accessToken = accessToken;
        authResult.refreshToken = refreshToken;
        authResult.user = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            handle: user.handle,
            avatarUrl: user.avatarUrl,
        };
        return authResult;
    }
}
