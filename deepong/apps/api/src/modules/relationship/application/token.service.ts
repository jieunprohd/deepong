import {Injectable} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
    public issueInvitationToken() {
        return crypto.randomUUID();
    }
}
