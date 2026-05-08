import { BadRequestException, Injectable } from '@nestjs/common';
import { Workspace } from '../domain/workspace.entity';
import { UpdateWorkspaceDto, WorkspaceResponse } from './dto/workspace.dto';

@Injectable()
export class UpdateWorkspaceUseCase {
  public async execute(
    userId: number,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    const ws =
      (await Workspace.findOne({ where: { userId } })) ??
      Workspace.createDefault(userId);

    try {
      ws.update(dto);
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Workspace 갱신 실패',
      );
    }

    await ws.save();
    return WorkspaceResponse.from(ws);
  }
}
