import {User} from "@modules/identity/domain/user.entity";

export class AccessTokenPayload {
    userId: number;
    email: string;

    public static from(user: User) {
        const payload = new AccessTokenPayload();
        payload.userId = user.id;
        payload.email = user.email;
        return payload;
    }
}