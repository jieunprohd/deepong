import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileResponse } from './dto/update.profile.response';

@Injectable()
export class UpdateProfileUseCase {
  public async execute(userId: number, dto: UpdateProfileDto): Promise<UpdateProfileResponse> {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    await user.updateUserInfo(dto).save();
    return UpdateProfileResponse.from(user);
  }
}
