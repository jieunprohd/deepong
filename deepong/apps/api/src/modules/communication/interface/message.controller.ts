import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/identity/infrastructure/jwt-auth.guard';
import { CurrentUser } from '@modules/identity/infrastructure/current-user.decorator';
import { SendMessageUseCase } from '../application/send-message.usecase';
import { GetMessagesUseCase } from '../application/get-messages.usecase';
import { EditMessageUseCase } from '../application/edit-message.usecase';
import { DeleteMessageUseCase } from '../application/delete-message.usecase';
import { SendMessageDto, EditMessageDto, GetMessagesQueryDto } from '../application/dto/message.dto';

@Controller('rooms/:roomId/messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
  ) {}

  @Post()
  sendMessage(
    @CurrentUser() user: { userId: number },
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.sendMessageUseCase.execute(user.userId, roomId, dto);
  }

  @Get()
  getMessages(
    @CurrentUser() user: { userId: number },
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query() query: GetMessagesQueryDto,
  ) {
    return this.getMessagesUseCase.execute(user.userId, roomId, query);
  }

  @Patch(':messageId')
  editMessage(
    @CurrentUser() user: { userId: number },
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: EditMessageDto,
  ) {
    return this.editMessageUseCase.execute(user.userId, roomId, messageId, dto);
  }

  @Delete(':messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @CurrentUser() user: { userId: number },
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.deleteMessageUseCase.execute(user.userId, roomId, messageId);
  }
}
