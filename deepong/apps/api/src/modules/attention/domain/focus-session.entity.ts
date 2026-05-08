import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';
import { FocusStartedEvent } from './events/focus-started.event';
import { FocusCompletedEvent } from './events/focus-completed.event';

export type FocusSessionType = 'POMODORO' | 'CUSTOM' | 'CALENDAR';

/**
 * FocusSession Aggregate
 *
 * 1회의 집중 세션. 시작/종료/완주/방해 횟수만 기록한다.
 * 사이클 단위 진행률은 클라이언트가 관리하며, 서버는 통계용으로 누적 저장한다.
 */
@Entity('FOCUS_SESSION')
export class FocusSession extends AggregateRoot {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  userId!: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  taskName!: string | null;

  @Column({
    type: 'enum',
    enum: ['POMODORO', 'CUSTOM', 'CALENDAR'],
    default: 'POMODORO',
  })
  sessionType!: FocusSessionType;

  @Column({ type: 'int', unsigned: true, default: 25 })
  plannedMinutes!: number;

  @Column({ type: 'datetime' })
  startedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ type: 'int', unsigned: true, default: 0, name: 'INTERRUPTION_CNT' })
  interruptionCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  // ---- Factory ----

  static start(props: {
    userId: number;
    plannedMinutes: number;
    sessionType?: FocusSessionType;
    taskName?: string | null;
  }): FocusSession {
    if (props.plannedMinutes <= 0) {
      throw new Error('plannedMinutes는 1 이상이어야 합니다.');
    }
    const session = new FocusSession();
    session.userId = props.userId;
    session.plannedMinutes = props.plannedMinutes;
    session.sessionType = props.sessionType ?? 'POMODORO';
    session.taskName = props.taskName ?? null;
    session.startedAt = new Date();
    session.endedAt = null;
    session.completed = false;
    session.interruptionCount = 0;

    session.addDomainEvent(
      new FocusStartedEvent(
        session.id,
        session.userId,
        session.plannedMinutes,
        session.startedAt,
      ),
    );
    return session;
  }

  // ---- Domain Methods ----

  isActive(): boolean {
    return this.endedAt === null;
  }

  /**
   * 세션 종료. 완주/중단 여부는 호출 측이 결정.
   * 한 번 종료된 세션은 다시 종료할 수 없다.
   */
  end(now: Date = new Date(), completed: boolean = false): void {
    if (this.endedAt) {
      throw new Error('이미 종료된 세션입니다.');
    }
    if (now.getTime() < this.startedAt.getTime()) {
      throw new Error('endedAt이 startedAt보다 빠를 수 없습니다.');
    }
    this.endedAt = now;
    this.completed = completed;

    this.addDomainEvent(
      new FocusCompletedEvent(
        this.id,
        this.userId,
        this.completed,
        this.actualMinutes(),
        this.endedAt,
      ),
    );
  }

  recordInterruption(): void {
    if (this.endedAt) return;
    this.interruptionCount += 1;
  }

  actualMinutes(): number {
    if (!this.endedAt) {
      return Math.floor((Date.now() - this.startedAt.getTime()) / 60_000);
    }
    return Math.floor(
      (this.endedAt.getTime() - this.startedAt.getTime()) / 60_000,
    );
  }
}
