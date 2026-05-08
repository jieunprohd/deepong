import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Workspace } from '../../domain/workspace.entity';

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workDays?: number[];

  /** HH:mm 또는 HH:mm:ss */
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(?::\d{2})?$/)
  workStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(?::\d{2})?$/)
  workEndTime?: string;

  @IsOptional()
  @IsBoolean()
  lunchBreak?: boolean;

  @IsOptional()
  @IsBoolean()
  shareWorktime?: boolean;
}

export class WorkspaceResponse {
  workspace: {
    workDays: number[];
    workStartTime: string;
    workEndTime: string;
    lunchBreak: boolean;
    shareWorktime: boolean;
  };

  static from(ws: Workspace): WorkspaceResponse {
    const r = new WorkspaceResponse();
    r.workspace = {
      workDays: ws.workDaysAsArray(),
      workStartTime: ws.workStartTime,
      workEndTime: ws.workEndTime,
      lunchBreak: ws.lunchBreak,
      shareWorktime: ws.shareWorktime,
    };
    return r;
  }
}
