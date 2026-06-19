export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: { products: number };
}
