import { Injectable } from '@nestjs/common';
import { Workspace } from '../domain/workspace.entity';
import { WorkspaceResponse } from './dto/workspace.dto';

@Injectable()
export class GetWorkspaceUseCase {
  public async execute(userId: number): Promise<WorkspaceResponse> {
    const ws =
      (await Workspace.findOne({ where: { userId } })) ??
      Workspace.createDefault(userId);
    return WorkspaceResponse.from(ws);
  }
}
