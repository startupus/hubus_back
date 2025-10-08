import { PrismaService } from '../common/prisma/prisma.service';
export interface CreateCompanyRequest {
    name: string;
    email: string;
    password: string;
    description?: string;
    website?: string;
    phone?: string;
    address?: any;
}
export interface CreateUserRequest {
    companyId: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    department?: string;
    permissions?: string[];
}
export interface CompanyResponse {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    description?: string;
    website?: string;
    phone?: string;
    address?: any;
    settings?: any;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    usersCount?: number;
}
export interface UserResponse {
    id: string;
    companyId: string;
    email: string;
    isActive: boolean;
    isVerified: boolean;
    firstName?: string;
    lastName?: string;
    position?: string;
    department?: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
export declare class CompanyService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createCompany(data: CreateCompanyRequest): Promise<CompanyResponse>;
    createUser(data: CreateUserRequest): Promise<UserResponse>;
    authenticate(email: string, password: string): Promise<{
        id: string;
        email: string;
        role: string;
        ownerType: 'user' | 'company';
        companyId?: string;
        permissions?: string[];
    }>;
    getCompanyById(id: string): Promise<CompanyResponse>;
    getUserById(id: string): Promise<UserResponse>;
    getCompanyUsers(companyId: string): Promise<UserResponse[]>;
    updateUser(id: string, updates: Partial<{
        firstName?: string;
        lastName?: string;
        position?: string;
        department?: string;
        permissions?: string[];
        isActive?: boolean;
    }>): Promise<UserResponse>;
    deleteUser(id: string): Promise<boolean>;
    getAllCompanies(): Promise<CompanyResponse[]>;
    getAllUsers(): Promise<UserResponse[]>;
    private transformCompany;
    private transformUser;
}
