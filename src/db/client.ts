import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'
export const prisma = new PrismaClient({
		// log: ['query', 'info', 'warn', 'error'],
}).$extends(withAccelerate());
