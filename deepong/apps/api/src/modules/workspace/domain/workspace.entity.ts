import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';

@Entity('WORKSPACE')
export class Workspace extends AggregateRoot {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Seoul' })
  timezone!: string;

  @Column({ type: 'time', default: '09:30:00' })
  workStartTime!: string;

  @Column({ type: 'time', default: '18:30:00' })
  workEndTime!: string;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  createdAt!: Date;

  // ---- Factory Method ----

  static createDefault(userId: number): Workspace {
    const ws = new Workspace();
    ws.userId = userId;
    ws.timezone = 'Asia/Seoul';
    ws.workStartTime = '09:30:00';
    ws.workEndTime = '18:30:00';
    return ws;
  }
}
