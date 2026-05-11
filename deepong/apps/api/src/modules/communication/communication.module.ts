import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { Room } from './domain/room/room.entity';
import { RoomMember } from './domain/room/room-member.entity';
import { Message } from './domain/message/message.entity';
import { MessageGateway } from './interface/message.gateway';
import { RoomController } from './interface/room.controller';
import { MessageController } from './interface/message.controller';
import { RoomSequenceGenerator } from './infrastructure/room-sequence-generator';
import { RelationshipAcl } from './infrastructure/acl/relationship.acl';
import { CreateRoomUseCase } from './application/create-room.usecase';
import { GetRoomsUseCase } from './application/get-rooms.usecase';
import { GetRoomUseCase } from './application/get-room.usecase';
import { SendMessageUseCase } from './application/send-message.usecase';
import { GetMessagesUseCase } from './application/get-messages.usecase';
import { EditMessageUseCase } from './application/edit-message.usecase';
import { DeleteMessageUseCase } from './application/delete-message.usecase';
import { FriendshipEventHandler } from './application/friendship-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMember, Message]),
    IdentityModule,
  ],
  controllers: [RoomController, MessageController],
  providers: [
    MessageGateway,
    RoomSequenceGenerator,
    RelationshipAcl,
    CreateRoomUseCase,
    GetRoomsUseCase,
    GetRoomUseCase,
    SendMessageUseCase,
    GetMessagesUseCase,
    EditMessageUseCase,
    DeleteMessageUseCase,
    FriendshipEventHandler,
  ],
  exports: [MessageGateway],
})
export class CommunicationModule {}
