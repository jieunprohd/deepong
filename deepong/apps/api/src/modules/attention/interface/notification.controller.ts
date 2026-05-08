import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { ListNotificationsUseCase } from '../application/list-notifications.usecase';
import { MarkNotificationsReadUseCase } from '../application/mark-notifications-read.usecase';
import {
  EvaluateNotificationCommand,
  EvaluateNotificationUseCase,
} from '../application/evaluate-notification.usecase';
import {
  ListNotificationsQueryDto,
  NotificationListResponse,
  NotificationResponse,
} from '../application/dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly listUC: ListNotificationsUseCase,
    private readonly markUC: MarkNotificationsReadUseCase,
    private readonly evaluateUC: EvaluateNotificationUseCase,
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

  /**
   * Communication 컨텍스트 미구현 상태에서 정책 평가를 직접 트리거하기 위한 임시 endpoint.
   * 추후 MessageSent 이벤트 핸들러로 대체 예정.
   */
  @Post('evaluate')
  async evaluate(
    @Body() cmd: EvaluateNotificationCommand,
  ): Promise<NotificationResponse> {
    return this.evaluateUC.execute(cmd);
  }
}
