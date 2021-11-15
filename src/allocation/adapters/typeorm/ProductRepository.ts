import { getRepository, Repository } from 'typeorm';
import { Batch } from '../../domain/Batch';
import { Product } from '../../domain/Product';
import { OrderLine } from '../../domain/OrderLine';
import { OrderLineEntity } from './entities/OrderLineEntity';
import { BatchEntity } from './entities/BatchEntity';
import { ProductEntity } from './entities/ProductEntity';
import { AbstractProductRepository } from '../../domain/AbstractRepository';

export class ProductRepository implements AbstractProductRepository {
  private batchRepo: Repository<BatchEntity>;
  private orderLineRepo: Repository<OrderLineEntity>;
  private productRepo: Repository<ProductEntity>;
  seen: Set<Product>;

  constructor() {
    this.batchRepo = getRepository(BatchEntity);
    this.orderLineRepo = getRepository(OrderLineEntity);
    this.productRepo = getRepository(ProductEntity);
    this.seen = new Set();
  }

  async getByBatchRef(ref: string): Promise<Product> {
    const batch = await this.batchRepo.findOne({ reference: ref });
    if (!batch) {
      return;
    }
    const productEntity = await this.productRepo.findOne({ sku: batch.sku });
    const product = await this.toDomain(productEntity, batch.sku);
    this.seen.add(product);
    return product;
  }

  async add(product: Product): Promise<void> {
    await this.toPersist(product);
    this.seen.add(product);
  }

  async get(sku: string): Promise<Product> {
    const productEntity = await this.productRepo.findOne({ sku });
    if (!productEntity) {
      return;
    }
    const product = await this.toDomain(productEntity, sku);
    this.seen.add(product);
    return product;
  }

  private async toDomain(
    productEntity: ProductEntity,
    sku: string
  ): Promise<Product> {
    const batches = await this.batchRepo.find({
      where: { sku },
      relations: ['allocations']
    });

    const product = Product.create({
      id: productEntity.id,
      sku: productEntity.sku,
      batches: batches.map((batch) => {
        return Batch.create({
          id: batch.id,
          reference: batch.reference,
          sku: batch.sku,
          qty: batch.qty,
          eta: batch.eta,
          purchasedQuantity: batch.purchasedQuantity,
          allocations: batch.allocations.map((allocation) => {
            return OrderLine.create({
              id: allocation.id,
              sku: allocation.sku,
              orderId: allocation.orderId,
              qty: allocation.qty
            });
          })
        });
      })
    });
    return product;
  }

  private async toPersist(product: Product): Promise<Partial<ProductEntity>> {
    const productEntity = new ProductEntity();
    productEntity.id = product.id;
    productEntity.sku = product.sku;
    productEntity.versionNumber = product.versionNumber;

    if (product.batches.length) {
      const batchEntities: BatchEntity[] = [];
      for (const batch of product.batches) {
        const batchEntity = new BatchEntity();
        batchEntity.id = batch.id;
        batchEntity.reference = batch.reference;
        batchEntity.sku = batch.sku;
        batchEntity.qty = batch.qty;
        batchEntity.eta = batch.eta;
        batchEntity.purchasedQuantity = batch.purchasedQuantity;
        batchEntities.push(batchEntity);

        if (batch.allocations.length) {
          const allocations: OrderLineEntity[] = [];
          for (const allocation of batch.allocations) {
            const orderLineEntity = new OrderLineEntity();
            orderLineEntity.id = allocation.id;
            orderLineEntity.orderId = allocation.orderId;
            orderLineEntity.sku = allocation.sku;
            orderLineEntity.qty = allocation.qty;
            allocations.push(orderLineEntity);
          }
          batchEntity.allocations = allocations;
          await this.orderLineRepo.save(allocations);
        }
      }
      await this.batchRepo.save(batchEntities);
    }
    await productEntity.save();
    return productEntity;
  }
}
