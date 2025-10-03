import { PrismaService } from '../../common/prisma/prisma.service';
import { User } from '@ai-aggregator/shared';
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUserById(userId: string): Promise<User>;
    getUserByEmail(email: string): Promise<User>;
    updateUser(userId: string, updateData: Partial<User>): Promise<User>;
    deactivateUser(userId: string): Promise<void>;
    deleteUser(userId: string): Promise<void>;
    private mapUserToDto;
}
