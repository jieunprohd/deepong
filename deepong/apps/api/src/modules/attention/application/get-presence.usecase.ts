import { Injectable } from '@nestjs/common';
import { PresenceSnapshot } from '../domain/presence-snapshot.entity';
import { PresenceResponse } from './dto/presence.dto';

@Injectable()
export class GetPresenceUseCase {
  public async execute(userId: number): Promise<PresenceResponse> {
    const snapshot = await PresenceSnapshot.findOne({ where: { userId } });
    if (!snapshot) {
      // 첫 조회는 OFF 기본값으로 응답 (저장은 변경 시점에 수행)
      return {
        status: 'OFF',
        lastOnlineAt: null,
        lastFocusStartAt: null,
        updatedAt: new Date().toISOString(),
      };
    }
    return PresenceResponse.from(snapshot);
  }
}
