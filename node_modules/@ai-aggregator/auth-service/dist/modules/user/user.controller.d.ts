import { Request } from 'express';
import { UserService } from './user.service';
import { UserProfileDto } from '@ai-aggregator/shared';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getProfile(req: Request): Promise<User>;
    updateProfile(updateData: Partial<UserProfileDto>, req: Request): Promise<User>;
    deleteAccount(req: Request): Promise<void>;
}
