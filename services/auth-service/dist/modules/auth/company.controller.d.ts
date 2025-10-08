import { CompanyService } from './company.service';
export declare class CompanyController {
    private readonly companyService;
    constructor(companyService: CompanyService);
    registerCompany(companyData: {
        name: string;
        email: string;
        password: string;
        description?: string;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        name: string;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    createUser(companyId: string, userData: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        position?: string;
        department?: string;
    }): Promise<{
        id: string;
        email: string;
        companyId: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string | null;
        lastName: string | null;
        position: string | null;
        department: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getCompany(companyId: string): Promise<{
        users: {
            id: string;
            email: string;
            companyId: string;
            passwordHash: string;
            isActive: boolean;
            isVerified: boolean;
            role: import(".prisma/client").$Enums.UserRole;
            firstName: string | null;
            lastName: string | null;
            position: string | null;
            department: string | null;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
            lastLoginAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        name: string;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    updateCompany(companyId: string, updateData: {
        name?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        name: string;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getCompanyUsers(companyId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
        isVerified: boolean;
        firstName: string;
        lastName: string;
        position: string;
        department: string;
        createdAt: Date;
    }[]>;
    getAllCompanies(): Promise<({
        users: {
            id: string;
            email: string;
            isActive: boolean;
            firstName: string;
            lastName: string;
        }[];
    } & {
        id: string;
        email: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        name: string;
        description: string | null;
        website: string | null;
        phone: string | null;
        address: import("@prisma/client/runtime/library").JsonValue | null;
        settings: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    getAllUsers(): Promise<({
        company: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        email: string;
        companyId: string;
        passwordHash: string;
        isActive: boolean;
        isVerified: boolean;
        role: import(".prisma/client").$Enums.UserRole;
        firstName: string | null;
        lastName: string | null;
        position: string | null;
        department: string | null;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
