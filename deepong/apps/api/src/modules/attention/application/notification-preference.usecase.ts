import { Injectable } from '@nestjs/common';
import { NotificationPreference } from '../domain/notification-preference.entity';
import {
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceDto,
} from './dto/notification-preference.dto';

@Injectable()
export class GetNotificationPreferenceUseCase {
  public async execute(userId: number): Promise<NotificationPreferenceResponse> {
    const pref = await this.findOrCreate(userId);
    return NotificationPreferenceResponse.from(pref);
  }

  private async findOrCreate(userId: number): Promise<NotificationPreference> {
    const existing = await NotificationPreference.findOne({ where: { userId } });
    if (existing) return existing;

    const created = NotificationPreference.defaultsFor(userId);
    await created.save();
    return created;
  }
}

@Injectable()
export class UpdateNotificationPreferenceUseCase {
  public async execute(
    userId: number,
    dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponse> {
    const pref =
      (await NotificationPreference.findOne({ where: { userId } })) ??
      NotificationPreference.defaultsFor(userId);

    pref.update(dto);
    await pref.save();

    return NotificationPreferenceResponse.from(pref);
  }
}
