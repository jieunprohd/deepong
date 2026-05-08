import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { GetWorkspaceUseCase } from '../application/get-workspace.usecase';
import { UpdateWorkspaceUseCase } from '../application/update-workspace.usecase';
import {
  UpdateWorkspaceDto,
  WorkspaceResponse,
} from '../application/dto/workspace.dto';

@Controller('me/workspace')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(
    private readonly getUC: GetWorkspaceUseCase,
    private readonly updateUC: UpdateWorkspaceUseCase,
  ) {}

  @Get()
  async get(
    @CurrentUser() user: { userId: number },
  ): Promise<WorkspaceResponse> {
    return this.getUC.execute(user.userId);
  }

  @Put()
  async update(
    @CurrentUser() user: { userId: number },
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    return this.updateUC.execute(user.userId, dto);
  }
}
