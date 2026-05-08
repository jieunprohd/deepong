import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { ListCatchupFeedUseCase } from '../application/list-catchup-feed.usecase';
import { RecordFeedActionUseCase } from '../application/record-feed-action.usecase';
import {
  CatchupFeedResponse,
  FeedActionResponse,
  ListCatchupQueryDto,
  RecordFeedActionDto,
} from '../application/dto/catchup.dto';

@Controller('catchup')
@UseGuards(JwtAuthGuard)
export class CatchupController {
  constructor(
    private readonly listUC: ListCatchupFeedUseCase,
    private readonly actionUC: RecordFeedActionUseCase,
  ) {}

  @Get('feed')
  async feed(
    @CurrentUser() user: { userId: number },
    @Query() query: ListCatchupQueryDto,
  ): Promise<CatchupFeedResponse> {
    return this.listUC.execute(user.userId, query);
  }

  @Post('actions')
  async record(
    @CurrentUser() user: { userId: number },
    @Body() dto: RecordFeedActionDto,
  ): Promise<FeedActionResponse> {
    return this.actionUC.execute(user.userId, dto);
  }
}
