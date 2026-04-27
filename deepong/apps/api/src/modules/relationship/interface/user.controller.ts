import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "@modules/identity/infrastructure/jwt-auth.guard";
import {SearchUserUseCase} from "@modules/relationship/application/search.user.usecase";

@Controller('users')
export class UserController {
    constructor(private readonly searchUserUseCase: SearchUserUseCase) {
    }

    @Get('/search')
    @UseGuards(JwtAuthGuard)
    public async searchUserByHandle(@Query('handle') handle: string) {
        return this.searchUserUseCase.execute(handle);
    }
}