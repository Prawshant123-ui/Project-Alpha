import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const mockPrisma: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();