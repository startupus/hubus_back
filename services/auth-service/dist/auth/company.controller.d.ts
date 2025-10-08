import { CompanyService, CreateCompanyRequest, CreateUserRequest } from './company.service';
export declare class CompanyController {
    private readonly companyService;
    constructor(companyService: CompanyService);
    registerCompany(data: CreateCompanyRequest): Promise<import("./company.service").CompanyResponse>;
    createUser(data: CreateUserRequest, req: any): Promise<import("./company.service").UserResponse>;
    authenticate(body: {
        email: string;
        password: string;
    }): Promise<{
        id: string;
        email: string;
        role: string;
        ownerType: "user" | "company";
        companyId?: string;
        permissions?: string[];
    }>;
    getProfile(req: any): Promise<import("./company.service").CompanyResponse | import("./company.service").UserResponse>;
    getCompanyUsers(companyId?: string, req?: any): Promise<import("./company.service").UserResponse[]>;
    getAllCompanies(): Promise<import("./company.service").CompanyResponse[]>;
    getAllUsers(): Promise<import("./company.service").UserResponse[]>;
    getCompanyById(id: string, req: any): Promise<import("./company.service").CompanyResponse>;
    getUserById(id: string, req: any): Promise<import("./company.service").UserResponse>;
    updateUser(id: string, updates: any, req: any): Promise<import("./company.service").UserResponse>;
    deleteUser(id: string, req: any): Promise<boolean>;
}
