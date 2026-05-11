import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ROOM_MEMBER')
export class RoomMember extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  roomId!: number;

  @Column({ type: 'bigint', unsigned: true })
  userId!: number;

  @CreateDateColumn()
  joinedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  leftAt!: Date | null;
}
