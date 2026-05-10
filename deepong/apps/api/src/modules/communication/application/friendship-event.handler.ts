import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { MessageGateway } from '../interface/message.gateway';

@Injectable()
export class FriendshipEventHandler {
  constructor(
    private readonly gateway: MessageGateway,
    private readonly dataSource: DataSource,
  ) {}

  @OnEvent('FriendshipAcceptedEvent')
  async handleFriendshipAccepted(event: { aggregateId: number; requestUserId: number; addressedUserId: number; acceptedAt: Date }): Promise<void> {
    const [requester, addressee] = await Promise.all([
      this.fetchUser(event.requestUserId),
      this.fetchUser(event.addressedUserId),
    ]);
    if (!requester || !addressee) return;

    const payload = {
      id: String(event.aggregateId),
      status: 'ACCEPTED',
      acceptedAt: event.acceptedAt.toISOString(),
    };

    this.gateway.emitFriendshipEstablished(event.requestUserId, {
      ...payload,
      peer: { id: String(addressee.ID), nickname: addressee.NICKNAME, handle: addressee.HANDLE, avatarUrl: addressee.AVATAR_URL ?? null },
    });
    this.gateway.emitFriendshipEstablished(event.addressedUserId, {
      ...payload,
      peer: { id: String(requester.ID), nickname: requester.NICKNAME, handle: requester.HANDLE, avatarUrl: requester.AVATAR_URL ?? null },
    });
  }

  @OnEvent('FriendshipRemovedEvent')
  handleFriendshipRemoved(event: { aggregateId: number; ownerUserId: number; peerUserId: number }): void {
    const payload = { friendshipId: String(event.aggregateId), peerUserId: String(event.peerUserId) };
    this.gateway.emitFriendshipRemoved(event.ownerUserId, payload);
    this.gateway.emitFriendshipRemoved(event.peerUserId, { friendshipId: String(event.aggregateId), peerUserId: String(event.ownerUserId) });
  }

  private async fetchUser(userId: number): Promise<any> {
    const rows = await this.dataSource.query(
      `SELECT ID, NICKNAME, HANDLE, AVATAR_URL FROM USER WHERE ID = ? LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }
}
