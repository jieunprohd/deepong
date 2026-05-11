/** 스펙 4.4 응답 스키마 */
export interface MessageNewPayload {
  id: string;
  roomId: string;
  senderUserId: string;
  clientMessageId: string;
  seq: number;
  tone: string;
  contentType: string;
  content: string;
  replyToMessageId: string | null;
  version: number;
  createdAt: string;
  editedAt: string | null;
}

/** message:updated 페이로드 — 수정된 메시지 전체 */
export type MessageUpdatedPayload = MessageNewPayload;

/** message:deleted 페이로드 */
export interface MessageDeletedPayload {
  roomId: string;
  messageId: string;
  seq: number;
  deletedAt: string;
}

/** room:created 페이로드 — 스펙 4.1 응답 스키마 */
export interface RoomCreatedPayload {
  id: string;
  type: string;
  name: string | null;
  defaultTone: string;
  members: Array<{ userId: string; nickname: string; avatarUrl: string | null }>;
  lastMessage: {
    content: string;
    tone: string;
    senderUserId: string;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  createdAt: string;
}

/** room:updated 페이로드 — 이름·멤버 변경 broadcast (RoomView 전체) */
export type RoomUpdatedPayload = RoomCreatedPayload;

/** room:left 페이로드 — 본인이 방을 나갔다 */
export interface RoomLeftPayload {
  roomId: string;
}

/** friendship:established 페이로드 — 스펙 3.3 응답 스키마 */
export interface FriendshipEstablishedPayload {
  id: string;
  peer: { id: string; nickname: string; handle: string; avatarUrl: string | null };
  status: string;
  acceptedAt: string;
}

/** friendship:removed 페이로드 */
export interface FriendshipRemovedPayload {
  friendshipId: string;
  peerUserId: string;
}
