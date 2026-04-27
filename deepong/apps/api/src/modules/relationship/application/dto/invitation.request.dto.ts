import {IsBoolean, IsNotEmpty, Max, Min} from "class-validator";

export class InvitationRequestDto {
    @IsNotEmpty()
    @IsBoolean()
    singleUse: boolean;

    @IsNotEmpty()
    @Min(1)
    @Max(168)
    ttlHours: number;
}