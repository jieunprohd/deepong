import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../infrastructure/jwt-auth.guard';
import { CurrentUser } from '../infrastructure/current-user.decorator';
import { GetMeUseCase } from '../application/get-me.usecase';
import { UpdateProfileUseCase } from '../application/update-profile.usecase';
import { UpdateProfileDto } from '../application/dto/update-profile.dto';

@Controller('me')
export class MeController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { userId: number }) {
    return this.getMeUseCase.execute(user.userId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfileUseCase.execute(user.userId, dto);
  }
}
