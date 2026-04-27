import {Controller, Delete, Get, Param, Query, UseGuards} from "@nestjs/common";
import {JwtAuthGuard} from "@modules/identity/infrastructure/jwt-auth.guard";
import {CurrentUser} from "@modules/identity/infrastructure/current-user.decorator";
import {FindFriendshipUsecase} from "@modules/relationship/application/find.friendship.usecase";
import {DeleteFriendshipUseCase} from "@modules/relationship/application/delete.friendship.usecase";

@Controller('friendship')
export class FriendshipController {
    constructor(
        private readonly findFriendshipUsecase: FindFriendshipUsecase,
        private readonly deleteFriendshipUseCase: DeleteFriendshipUseCase
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

    @Delete('/:friendshipId')
    @UseGuards(JwtAuthGuard)
    public async deleteFriendship(@CurrentUser() user: {
        userId: number
    }, @Param('friendshipId') friendshipId: number) {
        return this.deleteFriendshipUseCase.execute(user.userId, friendshipId);
    }
}
