import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
export const prisma = new PrismaClient({
		// log: ['query', 'info', 'warn', 'error'],
}).$extends(withAccelerate());
