import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import {
  GetCommunicationNormUseCase,
  GetMyCommunicationNormsUseCase,
  UpsertCommunicationNormUseCase,
} from '../application/communication-norm.usecase';
import {
  CommunicationNormListResponse,
  CommunicationNormResponse,
  UpsertCommunicationNormDto,
} from '../application/dto/communication-norm.dto';

@Controller('norms')
@UseGuards(JwtAuthGuard)
export class CommunicationNormController {
  constructor(
    private readonly listUC: GetMyCommunicationNormsUseCase,
    private readonly getUC: GetCommunicationNormUseCase,
    private readonly upsertUC: UpsertCommunicationNormUseCase,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: { userId: number },
  ): Promise<CommunicationNormListResponse> {
    return this.listUC.execute(user.userId);
  }

  @Get(':friendUserId')
  async get(
    @CurrentUser() user: { userId: number },
    @Param('friendUserId', ParseIntPipe) friendUserId: number,
  ): Promise<CommunicationNormResponse> {
    return this.getUC.execute(user.userId, friendUserId);
  }

  @Put(':friendUserId')
  async upsert(
    @CurrentUser() user: { userId: number },
    @Param('friendUserId', ParseIntPipe) friendUserId: number,
    @Body() dto: UpsertCommunicationNormDto,
  ): Promise<CommunicationNormResponse> {
    return this.upsertUC.execute(user.userId, friendUserId, dto);
  }
}
