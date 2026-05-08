import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import {
  GetNotificationPreferenceUseCase,
  UpdateNotificationPreferenceUseCase,
} from '../application/notification-preference.usecase';
import {
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceDto,
} from '../application/dto/notification-preference.dto';

@Controller('me/notification-preference')
@UseGuards(JwtAuthGuard)
export class NotificationPreferenceController {
  constructor(
    private readonly getUC: GetNotificationPreferenceUseCase,
    private readonly updateUC: UpdateNotificationPreferenceUseCase,
  ) {}

  @Get()
  async get(
    @CurrentUser() user: { userId: number },
  ): Promise<NotificationPreferenceResponse> {
    return this.getUC.execute(user.userId);
  }

  @Put()
  async update(
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreferenceResponse> {
    return this.updateUC.execute(user.userId, dto);
  }
}
