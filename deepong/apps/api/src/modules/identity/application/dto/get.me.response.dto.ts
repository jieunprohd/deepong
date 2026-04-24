import {User} from "@modules/identity/domain/user.entity";
import {Workspace} from "@modules/workspace/domain/workspace.entity";

export class MeResult {
    id: number;
    email: string;
    nickname: string;
    handle: string;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    locale: string;
    workspace: {
        timezone: string;
        workStartTime: string;
        workEndTime: string;
    } | null;

    public static from(user: User, workspace?: Workspace) {
        const response = new MeResult();
        response.id = user.id;
        response.email = user.email;
        response.nickname = user.nickname;
        response.handle = user.handle;
        response.bio = user.bio;
        response.avatarUrl = user.avatarUrl;
        response.timezone = user.timezone;
        response.locale = user.locale;
        response.workspace = workspace
            ? {
                timezone: workspace.timezone,
                workStartTime: workspace.workStartTime,
                workEndTime: workspace.workEndTime,
            }
            : null;
        return response;
    }
}