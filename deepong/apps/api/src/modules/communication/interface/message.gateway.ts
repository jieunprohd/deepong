import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { TokenService } from '@modules/identity/application/token.service';
import { RoomMember } from '../domain/room/room-member.entity';
import {
  FriendshipEstablishedPayload,
  FriendshipRemovedPayload,
  MessageDeletedPayload,
  MessageNewPayload,
  MessageUpdatedPayload,
  RoomCreatedPayload,
  RoomLeftPayload,
  RoomUpdatedPayload,
} from './ws-events.types';

@WebSocketGateway({ namespace: '/ws', cors: true })
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
  ) {}

  /**
   * JWT 검증을 socket.io 미들웨어로 처리.
   * 실패 시 connect_error 이벤트가 클라이언트에 발생한다.
   */
  afterInit(server: Server): void {
    server.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) {
          return next(new Error('TOKEN_INVALID'));
        }
        const payload = this.tokenService.verifyAccessToken(token);
        socket.data.userId = payload.userId;
        next();
      } catch {
        next(new Error('TOKEN_INVALID'));
      }
    });
  }

  /**
   * 연결 성공 후 유저 전용 채널 + 소속 방 채널에 join.
   * - user:{userId} : friendship 이벤트 수신
   * - room:{roomId} : 메시지 이벤트 수신
   */
  async handleConnection(client: Socket): Promise<void> {
    const userId = client.data.userId as number;
    await client.join(`user:${userId}`);

    const memberships = await this.roomMemberRepository.find({
      where: { userId, leftAt: IsNull() },
      select: ['roomId'],
    });
    await Promise.all(memberships.map((m) => client.join(`room:${m.roomId}`)));
  }

  handleDisconnect(_client: Socket): void {}

  // ── Helper: 특정 소켓을 room 채널에 추가 (POST /rooms 성공 시 호출)
  async joinRoom(userId: number, roomId: number): Promise<void> {
    const sockets = await this.server.fetchSockets();
    for (const s of sockets) {
      if ((s.data as { userId?: number }).userId === userId) {
        await s.join(`room:${roomId}`);
      }
    }
  }

  // ── Helper: 특정 사용자의 소켓을 room 채널에서 제거 (방 나가기 시 호출)
  async leaveRoom(userId: number, roomId: number): Promise<void> {
    const sockets = await this.server.fetchSockets();
    for (const s of sockets) {
      if ((s.data as { userId?: number }).userId === userId) {
        await s.leave(`room:${roomId}`);
      }
    }
  }

  // ── Server → Client 브로드캐스트 (스펙 5.2) ──────────────────────────

  emitMessageNew(roomId: number, payload: MessageNewPayload): void {
    this.server.to(`room:${roomId}`).emit('message:new', payload);
  }

  emitMessageUpdated(roomId: number, payload: MessageUpdatedPayload): void {
    this.server.to(`room:${roomId}`).emit('message:updated', payload);
  }

  emitMessageDeleted(roomId: number, payload: MessageDeletedPayload): void {
    this.server.to(`room:${roomId}`).emit('message:deleted', payload);
  }

  emitRoomCreated(userId: number, payload: RoomCreatedPayload): void {
    this.server.to(`user:${userId}`).emit('room:created', payload);
  }

  emitRoomUpdated(roomId: number, payload: RoomUpdatedPayload): void {
    this.server.to(`room:${roomId}`).emit('room:updated', payload);
  }

  emitRoomLeft(userId: number, payload: RoomLeftPayload): void {
    this.server.to(`user:${userId}`).emit('room:left', payload);
  }

  emitFriendshipEstablished(userId: number, payload: FriendshipEstablishedPayload): void {
    this.server.to(`user:${userId}`).emit('friendship:established', payload);
  }

  emitFriendshipRemoved(userId: number, payload: FriendshipRemovedPayload): void {
    this.server.to(`user:${userId}`).emit('friendship:removed', payload);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, data: { roomId: number }): void {
    const userId = client.data.userId as number;
    client.to(`room:${data.roomId}`).emit('typing:start', { roomId: data.roomId, userId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, data: { roomId: number }): void {
    const userId = client.data.userId as number;
    client.to(`room:${data.roomId}`).emit('typing:stop', { roomId: data.roomId, userId });
  }
}
