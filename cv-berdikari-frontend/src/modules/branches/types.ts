export interface Branch {
  id: string;
  branchCode: string; // Ubah 'code' menjadi 'branchCode' agar sesuai backend
  name: string;
  address: string;
  phone: string;
  region: string;
  createdAt?: string;
  updatedAt?: string;
}