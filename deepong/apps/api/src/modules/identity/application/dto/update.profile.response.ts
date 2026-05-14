import { User } from '@modules/identity/domain/user.entity';

export class UpdateProfileResponse {
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

  public static from(user: User): UpdateProfileResponse {
    const response = new UpdateProfileResponse();
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
    return response;
  }
}
