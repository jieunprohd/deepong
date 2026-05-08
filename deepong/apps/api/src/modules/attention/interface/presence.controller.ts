import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { GetPresenceUseCase } from '../application/get-presence.usecase';
import { UpdatePresenceUseCase } from '../application/update-presence.usecase';
import { UpdatePresenceDto, PresenceResponse } from '../application/dto/presence.dto';

@Controller('me/presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(
    private readonly getPresence: GetPresenceUseCase,
    private readonly updatePresence: UpdatePresenceUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: { userId: number }): Promise<PresenceResponse> {
    return this.getPresence.execute(user.userId);
  }

  @Put()
  async update(
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdatePresenceDto,
  ): Promise<PresenceResponse> {
    return this.updatePresence.execute(user.userId, dto);
  }
}
