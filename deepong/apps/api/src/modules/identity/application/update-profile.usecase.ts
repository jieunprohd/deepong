import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  public async execute(userId: number, dto: UpdateProfileDto): Promise<{ user: ReturnType<typeof this.toView> }> {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if ('bio' in dto) user.bio = dto.bio ?? null;
    if ('avatarUrl' in dto) user.avatarUrl = dto.avatarUrl ?? null;
    if (dto.timezone !== undefined) user.timezone = dto.timezone;

    await user.save();
    return { user: this.toView(user) };
  }

  private toView(user: User) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      handle: user.handle,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      locale: user.locale,
    };
  }
}
