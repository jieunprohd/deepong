import { Injectable } from '@nestjs/common';
import { Between, IsNull } from 'typeorm';
import { FocusSession } from '../domain/focus-session.entity';
import {
  FocusSessionResponse,
  FocusStatsResponse,
} from './dto/focus-session.dto';

@Injectable()
export class GetFocusStatsUseCase {
  /**
   * 특정 날짜의 집중 통계 + 진행 중 세션 반환.
   * date 미지정 시 오늘.
   */
  public async execute(
    userId: number,
    date?: string,
  ): Promise<FocusStatsResponse> {
    const target = date ? new Date(date) : new Date();
    const { start, end, ymd } = dayBounds(target);

    const sessions = await FocusSession.find({
      where: { userId, startedAt: Between(start, end) },
    });

    const completedCycles = sessions.filter((s) => s.completed).length;
    const totalFocusMinutes = sessions.reduce(
      (acc, s) => acc + s.actualMinutes(),
      0,
    );
    const totalInterruptions = sessions.reduce(
      (acc, s) => acc + s.interruptionCount,
      0,
    );

    const active = await FocusSession.findOne({
      where: { userId, endedAt: IsNull() },
    });

    return {
      date: ymd,
      completedCycles,
      totalFocusMinutes,
      totalInterruptions,
      activeSession: active ? FocusSessionResponse.from(active) : null,
    };
  }
}

function dayBounds(d: Date): { start: Date; end: Date; ymd: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { start, end, ymd };
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
