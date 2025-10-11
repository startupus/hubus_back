import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from '../../services/auth-service/src/modules/auth/company.service';
import { PrismaService } from '../../services/auth-service/src/common/prisma/prisma.service';
import { TestModuleBuilder, PrismaMock, TestData, MockHelper } from '../shared/test-helpers';

describe('CompanyService', () => {
  let service: CompanyService;
  let prismaMock: PrismaMock;

  beforeEach(async () => {
    prismaMock = new PrismaMock();
    MockHelper.setupPrismaMock(prismaMock);

    const module: TestingModule = await new TestModuleBuilder()
      .addProvider(CompanyService)
      .addProvider({
        provide: PrismaService,
        useValue: prismaMock,
      })
      .build();

    service = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => {
    MockHelper.resetAllMocks(prismaMock);
  });

  describe('getCompanyById', () => {
    it('should return company when found', async () => {
      const companyId = 'test-company-id';
      prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);

      const result = await service.getCompanyById(companyId);

      expect(result).toEqual(TestData.validCompany);
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyId },
      });
    });

    it('should return null when company not found', async () => {
      const companyId = 'non-existent-id';
      prismaMock.company.findUnique.mockResolvedValue(null);

      const result = await service.getCompanyById(companyId);

      expect(result).toBeNull();
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyId },
      });
    });

    it('should handle database errors', async () => {
      const companyId = 'test-company-id';
      const error = new Error('Database connection failed');
      prismaMock.company.findUnique.mockRejectedValue(error);

      await expect(service.getCompanyById(companyId)).rejects.toThrow('Database connection failed');
    });
  });

  describe('registerCompany', () => {
    it('should register new company successfully', async () => {
      const companyData = {
        email: 'new@company.com',
        name: 'New Company',
        password: 'password123',
      };

      prismaMock.company.findUnique.mockResolvedValue(null); // Company doesn't exist
      prismaMock.company.create.mockResolvedValue(TestData.validCompany);

      const result = await service.registerCompany(companyData);

      expect(result).toBeDefined();
      expect(prismaMock.company.findUnique).toHaveBeenCalledWith({
        where: { email: companyData.email },
      });
      expect(prismaMock.company.create).toHaveBeenCalled();
    });

    it('should throw error if company already exists', async () => {
      const companyData = {
        email: 'existing@company.com',
        name: 'Existing Company',
        password: 'password123',
      };

      prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);

      await expect(service.registerCompany(companyData)).rejects.toThrow();
    });

    it('should hash password before saving', async () => {
      const companyData = {
        email: 'new@company.com',
        name: 'New Company',
        password: 'password123',
      };

      prismaMock.company.findUnique.mockResolvedValue(null);
      prismaMock.company.create.mockResolvedValue(TestData.validCompany);

      await service.registerCompany(companyData);

      const createCall = prismaMock.company.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).toBeDefined();
      expect(createCall.data.passwordHash).not.toBe(companyData.password);
    });
  });

  describe('loginCompany', () => {
    it('should login company with valid credentials', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'password123',
      };

      prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);

      const result = await service.loginCompany(loginData);

      expect(result).toBeDefined();
      expect(result.company).toEqual(TestData.validCompany);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@company.com',
        password: 'password123',
      };

      prismaMock.company.findUnique.mockResolvedValue(null);

      await expect(service.loginCompany(loginData)).rejects.toThrow();
    });

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'wrongpassword',
      };

      prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);

      await expect(service.loginCompany(loginData)).rejects.toThrow();
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const companyId = 'test-company-id';
      const updateData = {
        name: 'Updated Company Name',
        description: 'Updated description',
      };

      prismaMock.company.update.mockResolvedValue({
        ...TestData.validCompany,
        ...updateData,
      });

      const result = await service.updateCompany(companyId, updateData);

      expect(result).toBeDefined();
      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: updateData,
      });
    });

    it('should handle update errors', async () => {
      const companyId = 'test-company-id';
      const updateData = { name: 'Updated Name' };
      const error = new Error('Update failed');

      prismaMock.company.update.mockRejectedValue(error);

      await expect(service.updateCompany(companyId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deactivateCompany', () => {
    it('should deactivate company successfully', async () => {
      const companyId = 'test-company-id';
      prismaMock.company.update.mockResolvedValue({
        ...TestData.validCompany,
        isActive: false,
      });

      await service.deactivateCompany(companyId);

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: companyId },
        data: { isActive: false },
      });
    });
  });
});
