import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly appService;
    private readonly prisma;
    constructor(appService: AppService, prisma: PrismaService);
    getHello(): string;
    setupAdmin(): Promise<{
        message: string;
        user: {
            id: string;
            name: string;
            email: string;
            password: string;
            role: string;
            createdAt: Date;
        };
    }>;
}
