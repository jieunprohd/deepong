import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './domain/workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  exports: [TypeOrmModule],
})
export class WorkspaceModule {}
