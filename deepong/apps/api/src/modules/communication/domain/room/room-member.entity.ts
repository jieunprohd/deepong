import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type MemberRole = 'ADMIN' | 'MEMBER';

@Entity('ROOM_MEMBER')
export class RoomMember extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  roomId!: number;

  @Column({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({ type: 'enum', enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' })
  role!: MemberRole;

  @Column({ type: 'datetime' })
  joinedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  leftAt!: Date | null;

  static initialize(roomId: number, userId: number, role: MemberRole = 'MEMBER'): RoomMember {
    const m = new RoomMember();
    m.roomId = roomId;
    m.userId = userId;
    m.role = role;
    m.joinedAt = new Date();
    m.leftAt = null;
    return m;
  }
}
