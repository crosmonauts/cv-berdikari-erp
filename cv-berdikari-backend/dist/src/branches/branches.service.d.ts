import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class BranchesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createBranchDto: CreateBranchDto): Promise<{
        id: string;
        name: string;
        branchCode: string;
        address: string;
        phone: string | null;
        region: string;
        npwp: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        branchCode: string;
        address: string;
        phone: string | null;
        region: string;
        npwp: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        branchCode: string;
        address: string;
        phone: string | null;
        region: string;
        npwp: string | null;
    }>;
    update(id: string, updateBranchDto: UpdateBranchDto): Promise<{
        id: string;
        name: string;
        branchCode: string;
        address: string;
        phone: string | null;
        region: string;
        npwp: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        branchCode: string;
        address: string;
        phone: string | null;
        region: string;
        npwp: string | null;
    }>;
}
