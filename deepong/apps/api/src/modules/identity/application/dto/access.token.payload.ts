import { User } from '@modules/identity/domain/user.entity';
import * as crypto from 'crypto';

export class AccessTokenPayload {
  userId: number;
  email: string;
  jti: string;

  public static from(user: User): AccessTokenPayload {
    const payload = new AccessTokenPayload();
    payload.userId = user.id;
    payload.email = user.email;
    payload.jti = crypto.randomUUID();
    return payload;
  }
}
