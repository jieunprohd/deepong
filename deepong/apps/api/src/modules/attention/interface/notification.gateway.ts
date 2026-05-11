import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '@modules/identity/application/token.service';

/**
 * 클라이언트로 보내는 신규 알림 페이로드.
 * NotificationCenter에서 사용하는 형태에 맞춤.
 */
export interface NotificationNewPayload {
  id: number;
  userId: number;
  messageId: number;
  roomId: number | null;
  roomName: string | null;
  roomType: string | null;
  senderUserId: number | null;
  senderNickname: string | null;
  content: string | null;
  contentType: string | null;
  deliveryMethod: 'IMMEDIATE' | 'BATCHED' | 'QUEUED' | 'DROPPED';
  triggerTone: 'CHAT' | 'ASK' | 'URGENT' | 'SHARE';
  triggerPresence: 'FREE' | 'WORKING' | 'FOCUS' | 'OFF';
  /** FOCUS 중 URGENT 같은 조용한 즉시 발송 (소리/진동 없이) */
  quiet: boolean;
  scheduledAt: string | null;
  createdAt: string;
}

/**
 * Attention 컨텍스트 전용 WebSocket Gateway.
 *
 * Communication의 MessageGateway와 같은 socket.io 서버에 별도 namespace로 붙는다.
 * 채널: user:{userId} → 본인에게 도착하는 알림 수신.
 */
@WebSocketGateway({ namespace: '/ws-attention', cors: true })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection
{
  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly tokenService: TokenService) {}

  afterInit(server: Server): void {
    server.use((socket, next) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error('TOKEN_INVALID'));
        const payload = this.tokenService.verifyAccessToken(token);
        socket.data.userId = payload.userId;
        next();
      } catch {
        next(new Error('TOKEN_INVALID'));
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.data.userId as number;
    await client.join(`user:${userId}`);
  }

  emitNotificationNew(userId: number, payload: NotificationNewPayload): void {
    this.server.to(`user:${userId}`).emit('notification:new', payload);
  }
}
