export interface RegionPrice {
  id: string;
  regionId: string;
  price: number;
  clientSku?: string;
  region: { id: string; code: string; name: string };
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  price: number;
  categoryId?: string;
  category?: { id: string; name: string };
  createdAt: string;
  stock: number;
  buyPrice: number;
  regionPrices?: RegionPrice[];
  batches?: any[];
}
