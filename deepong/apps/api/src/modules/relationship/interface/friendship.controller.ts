import {Controller, Get, Query, UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "@modules/identity/infrastructure/jwt-auth.guard";
import {CurrentUser} from "@modules/identity/infrastructure/current-user.decorator";
import {FindFriendshipUsecase} from "@modules/relationship/application/find.friendship.usecase";

@Controller('friendship')
export class FriendshipController {
    constructor(
        private readonly findFriendshipUsecase: FindFriendshipUsecase,
    ) {
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    public async getFriendShipLists(
        @CurrentUser() user: { userId: number },
        @Query('cursor') cursor?: string,
    ) {
        return this.findFriendshipUsecase.execute(user.userId, cursor);
    }
}
