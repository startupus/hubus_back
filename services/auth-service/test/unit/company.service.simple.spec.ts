import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from '../../src/modules/auth/company.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcrypt';

describe('CompanyService - Simple Tests', () => {
  let service: CompanyService;
  let prismaService: PrismaService;

  // Mock PrismaService
  const mockPrismaService: any = {
    company: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    referralCode: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
  };

  // Mock other services
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof service.registerCompany).toBe('function');
      expect(typeof service.loginCompany).toBe('function');
    });
  });

  describe('registerCompany', () => {
    it('should register a company successfully', async () => {
      const companyData = {
        name: 'Test Company',
        email: 'test@example.com',
        password: 'password123',
        description: 'Test description',
        website: 'https://test.com',
        phone: '+1234567890',
        address: { city: 'Test City', country: 'Test Country' },
      };

      const hashedPassword = 'hashed-password';
      const createdCompany = {
        id: 'company-id',
        ...companyData,
        passwordHash: hashedPassword,
        isActive: true,
        isVerified: true,
        role: 'company',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        metadata: {},
        parentCompanyId: null,
        billingMode: 'SELF_PAID',
        position: null,
        department: null,
        referralCode: 'TEST123',
        referredBy: null,
        referralCodeId: null,
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockPrismaService.company.create.mockResolvedValue(createdCompany);
      mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

      const result = await service.registerCompany(companyData);

      expect(result).toBeDefined();
      expect(result.company).toBeDefined();
      expect(result.company.name).toBe(companyData.name);
      expect(result.company.email).toBe(companyData.email);
      expect(mockPrismaService.company.create).toHaveBeenCalled();
    });

    it('should handle email already exists error', async () => {
      const companyData = {
        name: 'Test Company',
        email: 'existing@example.com',
        password: 'password123',
        description: 'Test description',
        website: 'https://test.com',
        phone: '+1234567890',
        address: { city: 'Test City', country: 'Test Country' },
      };

      mockPrismaService.company.findUnique.mockResolvedValue({
        id: 'existing-company',
        email: 'existing@example.com',
      });

      await expect(service.registerCompany(companyData)).rejects.toThrow();
    });
  });

  describe('loginCompany', () => {
    it('should login a company successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const company = {
        id: 'company-id',
        name: 'Test Company',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        isVerified: true,
        role: 'company',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        metadata: {},
        parentCompanyId: null,
        billingMode: 'SELF_PAID',
        position: null,
        department: null,
        referralCode: 'TEST123',
        referredBy: null,
        referralCodeId: null,
      };

      const accessToken = 'jwt-token';

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(accessToken);
      mockPrismaService.company.update.mockResolvedValue({
        ...company,
        lastLoginAt: new Date(),
      });

      const result = await service.loginCompany(loginData);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe(accessToken);
      expect(result.company).toBeDefined();
      expect(result.company.email).toBe(loginData.email);
    });

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const company = {
        id: 'company-id',
        name: 'Test Company',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        isVerified: true,
        role: 'company',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        metadata: {},
        parentCompanyId: null,
        billingMode: 'SELF_PAID',
        position: null,
        department: null,
        referralCode: 'TEST123',
        referredBy: null,
        referralCodeId: null,
      };

      mockPrismaService.company.findUnique.mockResolvedValue(company);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.loginCompany(loginData)).rejects.toThrow();
    });

    it('should handle company not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.loginCompany(loginData)).rejects.toThrow();
    });
  });
});
