import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { ListNotificationsUseCase } from '../application/list-notifications.usecase';
import { MarkNotificationsReadUseCase } from '../application/mark-notifications-read.usecase';
import {
  ListNotificationsQueryDto,
  NotificationListResponse,
} from '../application/dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly listUC: ListNotificationsUseCase,
    private readonly markUC: MarkNotificationsReadUseCase,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: { userId: number },
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationListResponse> {
    return this.listUC.execute(user.userId, query);
  }

  @Patch('read-all')
  async readAll(
    @CurrentUser() user: { userId: number },
  ): Promise<{ updated: number }> {
    return this.markUC.markAll(user.userId);
  }

  @Patch(':id/read')
  async readOne(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ ok: true }> {
    await this.markUC.markOne(user.userId, id);
    return { ok: true };
  }
}
