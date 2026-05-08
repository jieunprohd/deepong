import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '@modules/identity/identity.module';
import { Workspace } from './domain/workspace.entity';
import { GetWorkspaceUseCase } from './application/get-workspace.usecase';
import { UpdateWorkspaceUseCase } from './application/update-workspace.usecase';
import { WorkspaceController } from './interface/workspace.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace]), IdentityModule],
  controllers: [WorkspaceController],
  providers: [GetWorkspaceUseCase, UpdateWorkspaceUseCase],
  exports: [TypeOrmModule, GetWorkspaceUseCase],
})
export class WorkspaceModule {}
