import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AggregateRoot } from '@shared/types/aggregate-root.base';

/**
 * Workspace Aggregate
 *
 * 사용자별 1개. 업무 시간 정의는 Attention 정책의 입력으로 활용된다 (Customer-Supplier 관계).
 *  - workDays: '1,2,3,4,5' 같은 ISO 요일 CSV (0=일, 1=월 ... 6=토)
 *  - lunchBreak: 점심시간 동안 BATCHED 강등 적용 여부
 *  - shareWorktime: 친구에게 업무 시간 공개 (Relationship.CommunicationNorm 기본값과 별개)
 */
@Entity('WORKSPACE')
export class Workspace extends AggregateRoot {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  userId!: number;

  /** ISO 요일을 콤마로 구분한 문자열. workDaysAsArray()로 number[]로 노출 */
  @Column({ type: 'varchar', length: 20, default: '1,2,3,4,5' })
  workDays!: string;

  @Column({ type: 'time', default: '09:30:00' })
  workStartTime!: string;

  @Column({ type: 'time', default: '18:30:00' })
  workEndTime!: string;

  @Column({ type: 'boolean', default: true })
  lunchBreak!: boolean;

  @Column({ type: 'boolean', default: true })
  shareWorktime!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;

  // ---- Factory ----

  static createDefault(userId: number): Workspace {
    const ws = new Workspace();
    ws.userId = userId;
    ws.workDays = '1,2,3,4,5';
    ws.workStartTime = '09:30:00';
    ws.workEndTime = '18:30:00';
    ws.lunchBreak = true;
    ws.shareWorktime = true;
    return ws;
  }

  // ---- Domain Methods ----

  workDaysAsArray(): number[] {
    return this.workDays
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  }

  update(patch: {
    workDays?: number[];
    workStartTime?: string;
    workEndTime?: string;
    lunchBreak?: boolean;
    shareWorktime?: boolean;
  }): void {
    if (patch.workDays !== undefined) {
      this.workDays = serializeWorkDays(patch.workDays);
    }
    if (patch.workStartTime !== undefined) {
      this.workStartTime = ensureTime(patch.workStartTime);
    }
    if (patch.workEndTime !== undefined) {
      this.workEndTime = ensureTime(patch.workEndTime);
    }
    if (patch.lunchBreak !== undefined) this.lunchBreak = patch.lunchBreak;
    if (patch.shareWorktime !== undefined)
      this.shareWorktime = patch.shareWorktime;

    this.assertWorkHoursValid();
  }

  private assertWorkHoursValid(): void {
    if (this.workStartTime >= this.workEndTime) {
      throw new Error('업무 시작은 종료 시각보다 빠르지 않으면 안 됩니다.');
    }
  }
}

function serializeWorkDays(days: number[]): string {
  const cleaned = Array.from(
    new Set(
      days
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
    ),
  ).sort((a, b) => a - b);
  if (cleaned.length === 0) {
    throw new Error('업무 요일은 최소 1일 이상 선택해야 합니다.');
  }
  return cleaned.join(',');
}

function ensureTime(value: string): string {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  throw new Error(`잘못된 시각 형식입니다: ${value}`);
}
