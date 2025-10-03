import { Request } from 'express';
import { UserService } from './user.service';
import { UserProfileDto } from '@ai-aggregator/shared';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getProfile(req: Request): Promise<import("@ai-aggregator/shared").User>;
    updateProfile(updateData: Partial<UserProfileDto>, req: Request): Promise<import("@ai-aggregator/shared").User>;
    deleteAccount(req: Request): Promise<void>;
}
