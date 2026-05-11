import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';
import { ToneType } from '../message/tone.vo';
import { RoomCreatedEvent } from './events/room-created.event';

export type RoomType = 'DIRECT' | 'GROUP';

@Entity('ROOM')
export class Room extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'enum', enum: ['DIRECT', 'GROUP'] })
  type!: RoomType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'enum', enum: ['CHAT', 'ASK', 'URGENT', 'SHARE'], default: 'CHAT' })
  defaultTone!: ToneType;

  @Column({ type: 'bigint', unsigned: true })
  createdBy!: number;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt!: Date | null;

  @Column({ type: 'datetime' })
  createdAt!: Date;

  @Column({ type: 'datetime' })
  updatedAt!: Date;

  static initialize(props: {
    type: RoomType;
    name?: string | null;
    defaultTone?: ToneType;
    createdBy: number;
    memberIds: number[];
  }): Room {
    const room = new Room();
    room.type = props.type;
    room.name = props.name ?? null;
    room.defaultTone = props.defaultTone ?? 'CHAT';
    room.createdBy = props.createdBy;
    room.lastMessageAt = null;
    room.createdAt = new Date();
    room.updatedAt = new Date();
    room.addDomainEvent(new RoomCreatedEvent(0, room.type, props.memberIds));
    return room;
  }

  updateLastMessageAt(at: Date): void {
    if (!this.lastMessageAt || at > this.lastMessageAt) {
      this.lastMessageAt = at;
      this.updatedAt = new Date();
    }
  }
}
