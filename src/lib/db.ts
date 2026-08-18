import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const SAFE_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phoneNumber: true,
  dateOfBirth: true,
  role: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
  currentPlanId: true,
  createdAt: true,
  updatedAt: true,
};
