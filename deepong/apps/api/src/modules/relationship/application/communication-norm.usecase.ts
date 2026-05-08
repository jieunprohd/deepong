import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunicationNorm } from '../domain/communication-norm.entity';
import { Friendship } from '../domain/friendship.entity';
import { FriendshipStatus } from '../domain/friendship.status.type';
import {
  CommunicationNormListResponse,
  CommunicationNormResponse,
  UpsertCommunicationNormDto,
} from './dto/communication-norm.dto';

@Injectable()
export class GetMyCommunicationNormsUseCase {
  public async execute(
    userId: number,
  ): Promise<CommunicationNormListResponse> {
    const items = await CommunicationNorm.find({
      where: { ownerUserId: userId },
      order: { updatedAt: 'DESC' },
    });
    return {
      items: items.map((n) => CommunicationNormResponse.from(n)),
    };
  }
}

@Injectable()
export class GetCommunicationNormUseCase {
  public async execute(
    userId: number,
    friendUserId: number,
  ): Promise<CommunicationNormResponse> {
    const norm = await this.findOrInit(userId, friendUserId);
    return CommunicationNormResponse.from(norm);
  }

  private async findOrInit(
    userId: number,
    friendUserId: number,
  ): Promise<CommunicationNorm> {
    const existing = await CommunicationNorm.findOne({
      where: { ownerUserId: userId, friendUserId },
    });
    if (existing) return existing;
    return CommunicationNorm.defaultsFor(userId, friendUserId);
  }
}

@Injectable()
export class UpsertCommunicationNormUseCase {
  public async execute(
    userId: number,
    friendUserId: number,
    dto: UpsertCommunicationNormDto,
  ): Promise<CommunicationNormResponse> {
    if (userId === friendUserId) {
      throw new ForbiddenException(
        '자기 자신에 대한 알림 규범은 만들 수 없습니다.',
      );
    }
    await this.ensureFriendshipAccepted(userId, friendUserId);

    const norm =
      (await CommunicationNorm.findOne({
        where: { ownerUserId: userId, friendUserId },
      })) ?? CommunicationNorm.defaultsFor(userId, friendUserId);

    norm.update(dto);
    await norm.save();

    return CommunicationNormResponse.from(norm);
  }

  /**
   * 친구로 등록되지 않은 사용자에게는 norm을 만들 수 없도록 사전 검증.
   * (Identity의 직접 import 대신 Relationship 도메인 안에서 해결)
   */
  private async ensureFriendshipAccepted(
    userId: number,
    friendUserId: number,
  ): Promise<void> {
    const friendship = await Friendship.findBetween(userId, friendUserId);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new NotFoundException('친구 관계가 아닙니다.');
    }
  }
}
