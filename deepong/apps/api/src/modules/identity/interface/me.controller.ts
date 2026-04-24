import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';
import { CurrentUser } from '../infrastructure/current-user.decorator';
import { GetMeUseCase } from '../application/get-me.usecase';

@Controller('me')
export class MeController {
  constructor(private readonly getMeUseCase: GetMeUseCase) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { userId: number }) {
    return this.getMeUseCase.execute(user.userId);
  }
}
