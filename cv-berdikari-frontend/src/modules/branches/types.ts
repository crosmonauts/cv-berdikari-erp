export interface Branch {
  id: string;
  branchCode: string;
  name: string;
  address: string;
  phone: string;

  // --- REVISI: Disesuaikan dengan skema database baru ---
  regionId: string;
  region?: {
    id: string;
    name: string;
    code: string;
  };

  createdAt?: string;
  updatedAt?: string;
}
