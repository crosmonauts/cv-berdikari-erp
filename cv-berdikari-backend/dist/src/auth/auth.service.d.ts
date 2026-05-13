import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(email: string, pass: string): Promise<{
        message: string;
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
        };
    }>;
}
