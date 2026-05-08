import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { StartFocusSessionUseCase } from '../application/start-focus-session.usecase';
import { EndFocusSessionUseCase } from '../application/end-focus-session.usecase';
import { GetFocusStatsUseCase } from '../application/get-focus-stats.usecase';
import {
  EndFocusSessionDto,
  FocusSessionResponse,
  FocusStatsResponse,
  StartFocusSessionDto,
} from '../application/dto/focus-session.dto';

@Controller('focus')
@UseGuards(JwtAuthGuard)
export class FocusController {
  constructor(
    private readonly startUC: StartFocusSessionUseCase,
    private readonly endUC: EndFocusSessionUseCase,
    private readonly statsUC: GetFocusStatsUseCase,
  ) {}

  @Post('sessions')
  async start(
    @CurrentUser() user: { userId: number },
    @Body() dto: StartFocusSessionDto,
  ): Promise<FocusSessionResponse> {
    return this.startUC.execute(user.userId, dto);
  }

  @Post('sessions/:id/end')
  async end(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndFocusSessionDto,
  ): Promise<FocusSessionResponse> {
    return this.endUC.execute(user.userId, id, dto);
  }

  @Get('stats')
  async stats(
    @CurrentUser() user: { userId: number },
    @Query('date') date?: string,
  ): Promise<FocusStatsResponse> {
    return this.statsUC.execute(user.userId, date);
  }
}
