import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  FocusSession,
  FocusSessionType,
} from '../../domain/focus-session.entity';

export class StartFocusSessionDto {
  @IsInt()
  @Min(1)
  @Max(180)
  plannedMinutes!: number;

  @IsOptional()
  @IsEnum(['POMODORO', 'CUSTOM', 'CALENDAR'])
  sessionType?: FocusSessionType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  taskName?: string;
}

export class EndFocusSessionDto {
  @IsOptional()
  completed?: boolean;
}

export class FocusSessionResponse {
  id!: number;
  userId!: number;
  taskName!: string | null;
  sessionType!: FocusSessionType;
  plannedMinutes!: number;
  startedAt!: string;
  endedAt!: string | null;
  completed!: boolean;
  interruptionCount!: number;

  static from(s: FocusSession): FocusSessionResponse {
    const r = new FocusSessionResponse();
    r.id = s.id;
    r.userId = s.userId;
    r.taskName = s.taskName;
    r.sessionType = s.sessionType;
    r.plannedMinutes = s.plannedMinutes;
    r.startedAt = s.startedAt.toISOString();
    r.endedAt = s.endedAt?.toISOString() ?? null;
    r.completed = s.completed;
    r.interruptionCount = s.interruptionCount;
    return r;
  }
}

export class FocusStatsResponse {
  /** 조회 기준 날짜(YYYY-MM-DD) */
  date!: string;
  /** 완료한 사이클(완주 세션) 수 */
  completedCycles!: number;
  /** 누적 집중 시간(분) */
  totalFocusMinutes!: number;
  /** 방해받음 누적 횟수 */
  totalInterruptions!: number;
  /** 진행 중인 세션이 있는 경우 그 세션 */
  activeSession!: FocusSessionResponse | null;
}
