import { Product } from './Product';

export interface AbstractProductRepository {
  seen: Set<Product>;
  add(product: Product): Promise<void>;
  get(sku: string): Promise<Product>;
  getByBatchRef(ref: string): Promise<Product>;
}
