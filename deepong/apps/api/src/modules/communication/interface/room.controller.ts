import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { CreateRoomUseCase } from '../application/create-room.usecase';
import { GetRoomsUseCase } from '../application/get-rooms.usecase';
import { GetRoomUseCase } from '../application/get-room.usecase';
import { UpdateRoomUseCase } from '../application/update-room.usecase';
import { LeaveRoomUseCase } from '../application/leave-room.usecase';
import { AddRoomMembersUseCase } from '../application/add-room-members.usecase';
import {
  AddRoomMembersDto,
  CreateRoomDto,
  GetRoomsQueryDto,
  UpdateRoomDto,
} from '../application/dto/room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly getRoomsUseCase: GetRoomsUseCase,
    private readonly getRoomUseCase: GetRoomUseCase,
    private readonly updateRoomUseCase: UpdateRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly addRoomMembersUseCase: AddRoomMembersUseCase,
  ) {}

  @Post()
  createRoom(
    @CurrentUser() user: { userId: number },
    @Body() dto: CreateRoomDto,
  ) {
    return this.createRoomUseCase.execute(user.userId, dto);
  }

  @Get()
  getRooms(
    @CurrentUser() user: { userId: number },
    @Query() query: GetRoomsQueryDto,
  ) {
    return this.getRoomsUseCase.execute(user.userId, query);
  }

  @Get(':id')
  getRoom(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) roomId: number,
  ) {
    return this.getRoomUseCase.execute(user.userId, roomId);
  }

  @Patch(':id')
  updateRoom(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) roomId: number,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.updateRoomUseCase.execute(user.userId, roomId, dto);
  }

  @Post(':id/members')
  addMembers(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) roomId: number,
    @Body() dto: AddRoomMembersDto,
  ) {
    return this.addRoomMembersUseCase.execute(user.userId, roomId, dto);
  }

  @Delete(':id/members/me')
  @HttpCode(204)
  async leaveRoom(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) roomId: number,
  ): Promise<void> {
    await this.leaveRoomUseCase.execute(user.userId, roomId);
  }
}
