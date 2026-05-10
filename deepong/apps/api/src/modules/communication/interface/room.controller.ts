import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { CreateRoomUseCase } from '../application/create-room.usecase';
import { GetRoomsUseCase } from '../application/get-rooms.usecase';
import { GetRoomUseCase } from '../application/get-room.usecase';
import { CreateRoomDto, GetRoomsQueryDto } from '../application/dto/room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly getRoomsUseCase: GetRoomsUseCase,
    private readonly getRoomUseCase: GetRoomUseCase,
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
}
