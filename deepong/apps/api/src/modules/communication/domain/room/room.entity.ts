import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ROOM')
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'CHAT' })
  defaultTone!: string;

  @Column({ type: 'bigint', unsigned: true })
  createdBy!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  lastMessageAt!: Date | null;
}
