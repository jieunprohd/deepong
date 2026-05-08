import { User } from '@modules/identity/domain/user.entity';
import { Workspace } from '@modules/workspace/domain/workspace.entity';

export class WorkspaceView {
  workDays: number[];
  workStartTime: string;
  workEndTime: string;
  lunchBreak: boolean;
  shareWorktime: boolean;

  static from(workspace: Workspace): WorkspaceView {
    const v = new WorkspaceView();
    v.workDays = workspace.workDaysAsArray();
    v.workStartTime = workspace.workStartTime;
    v.workEndTime = workspace.workEndTime;
    v.lunchBreak = workspace.lunchBreak;
    v.shareWorktime = workspace.shareWorktime;
    return v;
  }
}

export class MeResult {
  user: {
    id: number;
    email: string;
    nickname: string;
    handle: string;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    locale: string;
  };
  workspace: WorkspaceView | null;

  public static from(user: User, workspace?: Workspace | null): MeResult {
    const response = new MeResult();
    response.user = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      handle: user.handle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale,
    };
    response.workspace = workspace ? WorkspaceView.from(workspace) : null;
    return response;
  }
}
