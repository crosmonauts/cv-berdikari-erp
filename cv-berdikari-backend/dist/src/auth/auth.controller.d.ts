import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signIn(signInDto: Record<string, any>): Promise<{
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
