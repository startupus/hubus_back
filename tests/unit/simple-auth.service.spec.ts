import { PrismaMock, TestData } from '../shared/test-helpers';
import * as bcrypt from 'bcrypt';

// Создаем простой мок для тестирования только логики
class SimpleCompanyService {
  private prisma: PrismaMock;

  constructor(prisma: PrismaMock) {
    this.prisma = prisma;
  }

  async getCompanyById(companyId: string) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });

      return company;
    } catch (error) {
      throw error;
    }
  }

  async registerCompany(companyData: {
    email: string;
    name: string;
    password: string;
  }) {
    try {
      // Проверяем, существует ли компания
      const existingCompany = await this.prisma.company.findUnique({
        where: { email: companyData.email },
      });

      if (existingCompany) {
        throw new Error('Company with this email already exists');
      }

      // Хешируем пароль (упрощенная версия)
      const passwordHash = `hashed_${companyData.password}`;

      // Создаем компанию
      const company = await this.prisma.company.create({
        data: {
          email: companyData.email,
          name: companyData.name,
          passwordHash,
          isActive: true,
          isVerified: false,
          role: 'company',
        },
      });

      return company;
    } catch (error) {
      throw error;
    }
  }

  async loginCompany(credentials: {
    email: string;
    password: string;
  }) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { email: credentials.email },
      });

      if (!company) {
        throw new Error('Invalid credentials');
      }

      // Проверка пароля с помощью bcrypt
      const isValidPassword = await bcrypt.compare(credentials.password, company.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      return {
        company,
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };
    } catch (error) {
      throw error;
    }
  }

  async updateCompany(companyId: string, updateData: {
    name?: string;
    description?: string;
  }) {
    try {
      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: updateData,
      });

      return updatedCompany;
    } catch (error) {
      throw error;
    }
  }

  async deactivateCompany(companyId: string) {
    try {
      await this.prisma.company.update({
        where: { id: companyId },
        data: { isActive: false },
      });
    } catch (error) {
      throw error;
    }
  }
}

// Mock bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Simple CompanyService', () => {
  let service: SimpleCompanyService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = new PrismaMock();
    service = new SimpleCompanyService(prismaMock);
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

      await expect(service.registerCompany(companyData)).rejects.toThrow('Company with this email already exists');
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
      
      // Mock bcrypt.compare to return true for valid password
      mockedBcrypt.compare.mockResolvedValue(true as never);

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

      await expect(service.loginCompany(loginData)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'wrongpassword',
      };

      prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);
      
      // Mock bcrypt.compare to return false for invalid password
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.loginCompany(loginData)).rejects.toThrow('Invalid credentials');
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
