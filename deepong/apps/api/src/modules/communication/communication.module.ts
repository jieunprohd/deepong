import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { Room } from './domain/room/room.entity';
import { RoomMember } from './domain/room/room-member.entity';
import { MessageGateway } from './interface/message.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomMember]),
    IdentityModule,
  ],
  providers: [MessageGateway],
  exports: [MessageGateway],
})
export class CommunicationModule {}
