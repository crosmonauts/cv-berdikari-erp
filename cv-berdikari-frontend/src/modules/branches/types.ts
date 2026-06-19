export interface Branch {
  id: string;
  branchCode: string;
  name: string;
  address: string;
  phone: string;
  npwp?: string;

  regionId: string;
  region?: {
    id: string;
    name: string;
    code: string;
  };
}
