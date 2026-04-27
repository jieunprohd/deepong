import {Injectable, NotFoundException} from "@nestjs/common";
import {User} from "@modules/identity/domain/user.entity";
import {FindUserResponse} from "@modules/relationship/application/dto/find.user.response";

@Injectable()
export class SearchUserUseCase {
    constructor() {
    }

    public async execute(handle: string) {
        const user = await this.findUsersByHandle(handle);

        if (!user) {
            throw new NotFoundException('해당 핸들의 사용자를 찾을 수 없습니다.');
        }

        return FindUserResponse.from(user);
    }

    private async findUsersByHandle(handle: string) {
        return await User.searchUserByHandle(handle);
    }
}