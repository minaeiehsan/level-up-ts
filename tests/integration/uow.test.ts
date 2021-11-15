import { getRepository } from 'typeorm';
import { db } from '../support';
import { Batch } from '../../src/allocation/domain/Batch';
import { OrderLine } from '../../src/allocation/domain/OrderLine';
import { BatchEntity } from '../../src/allocation/adapters/typeorm/entities/BatchEntity';
import { ProductEntity } from '../../src/allocation/adapters/typeorm/entities/ProductEntity';
import { Product } from '../../src/allocation/domain/Product';
import { ProductUnitOfWork } from '../../src/allocation/adapters/typeorm/ProductUnitOfWork';

describe('unit of work', () => {
  beforeAll(async () => await db.create());
  afterAll(async () => await db.close());
  beforeEach(async () => await db.clear());

  it('adds a product', async () => {
    const sku = 'PRODUCT-SKU';
    const batchWithAllocation = {
      reference: 'ref-1',
      qty: 100,
      sku
    };
    const batchWithoutAllocation = {
      reference: 'ref-2',
      qty: 200,
      sku
    };
    const orderLine1 = {
      orderId: 'order-1',
      sku,
      qty: 10
    };

    const orderLine2 = {
      orderId: 'order-2',
      sku,
      qty: 120
    };

    const product = Product.create({
      sku,
      batches: [
        Batch.create({
          ...batchWithAllocation,
          allocations: [
            OrderLine.create(orderLine1),
            OrderLine.create(orderLine2)
          ]
        }),
        Batch.create(batchWithoutAllocation)
      ]
    });

    const uow = new ProductUnitOfWork();
    await uow.start();
    const work = async () => await uow.products.add(product);
    await uow.commit(work);

    const productRepo = getRepository(ProductEntity);
    const batchRepo = getRepository(BatchEntity);

    const expectedProduct = await productRepo.findOne({
      where: { sku },
      select: ['sku', 'versionNumber']
    });
    const expectedBatchWithAllocation = await batchRepo.findOne({
      where: {
        reference: batchWithAllocation.reference
      },
      relations: ['allocations']
    });
    const expectedBatchWithoutAllocation = await batchRepo.findOne({
      reference: batchWithoutAllocation.reference
    });

    expect(expectedProduct).toEqual({
      sku,
      versionNumber: 0
    });

    expect(expectedBatchWithAllocation).toEqual(
      expect.objectContaining(batchWithAllocation)
    );
    expect(expectedBatchWithAllocation.allocations).toIncludeAllMembers([
      expect.objectContaining(orderLine1),
      expect.objectContaining(orderLine2)
    ]);
    expect(expectedBatchWithoutAllocation).toEqual(
      expect.objectContaining(batchWithoutAllocation)
    );
  });

  it('gets a product with relation', async () => {
    const sku = 'RUSTY-SOAPDISH';
    const orderLine1 = OrderLine.create({
      orderId: 'order1',
      qty: 10,
      sku
    });
    const orderLine2 = OrderLine.create({
      orderId: 'order2',
      qty: 20,
      sku
    });

    const batch1 = Batch.create({
      reference: 'batch1',
      sku,
      qty: 100,
      eta: new Date(),
      allocations: [orderLine1, orderLine2]
    });

    const batch2 = Batch.create({
      reference: 'batch2',
      sku,
      qty: 200,
      eta: new Date()
    });
    const product = Product.create({
      sku,
      batches: [batch1, batch2]
    });

    const uow = new ProductUnitOfWork();
    await uow.start();
    let expectedProduct;
    const work = async () => {
      await uow.products.add(product);
      expectedProduct = await uow.products.get(sku);
    };
    await uow.commit(work);

    expect(expectedProduct.id).toBeDefined();
    expect(expectedProduct.sku).toEqual(sku);
    expect(expectedProduct.batches).toHaveLength(2);

    const expectedBatch1 = expectedProduct.batches.find(
      (batch) => batch.reference === batch1.reference
    );
    expect(expectedBatch1.id).toBeDefined();
    expect(expectedBatch1.sku).toEqual(batch1.sku);
    expect(expectedBatch1.qty).toEqual(batch1.qty);
    expect(expectedBatch1.eta).toEqual(batch1.eta);

    const expectedOrderLine1 = expectedBatch1.allocations.find(
      (allocation) => allocation.orderId === orderLine1.orderId
    );
    const expectedOrderLine2 = expectedBatch1.allocations.find(
      (allocation) => allocation.orderId === orderLine2.orderId
    );
    expect(expectedOrderLine1.id).toBeDefined();
    expect(expectedOrderLine1.sku).toEqual(orderLine1.sku);
    expect(expectedOrderLine1.qty).toEqual(orderLine1.qty);
    expect(expectedOrderLine2.id).toBeDefined();
    expect(expectedOrderLine2.sku).toEqual(orderLine2.sku);
    expect(expectedOrderLine2.qty).toEqual(orderLine2.qty);

    const expectedBatch2 = expectedProduct.batches.find(
      (batch) => batch.reference === batch2.reference
    );
    expect(expectedBatch2.id).toBeDefined();
    expect(expectedBatch2.sku).toEqual(batch2.sku);
    expect(expectedBatch2.qty).toEqual(batch2.qty);
    expect(expectedBatch2.eta).toEqual(batch2.eta);
    expect(expectedBatch2.allocations).toHaveLength(0);
  });
});
