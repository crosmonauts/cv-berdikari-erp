import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
export declare class BranchesController {
    private readonly branchesService;
    constructor(branchesService: BranchesService);
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
