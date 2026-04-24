import {Injectable, NotFoundException} from '@nestjs/common';
import {User} from '../domain/user.entity';
import {Workspace} from '@modules/workspace/domain/workspace.entity';
import {MeResult} from "@modules/identity/application/dto/get.me.response.dto";

@Injectable()
export class GetMeUseCase {
    public async execute(userId: number): Promise<MeResult> {
        const user = await this.findUserById(userId);
        const workspace = await this.findWorkSpaceByUserId(userId);

        return MeResult.from(user, workspace);
    }

    private async findUserById(userId: number) {
        const user = await User.findOne({where: {id: userId}});
        if (!user) {
            throw new NotFoundException('사용자를 찾을 수 없습니다.');
        }
        return user;
    }

    private async findWorkSpaceByUserId(userId: number) {
        return await Workspace.findOne({where: {userId}});
    }
}
