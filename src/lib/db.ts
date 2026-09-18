import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

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
