import { db } from '../support';
import { ProductUnitOfWork } from '../../src/allocation/adapters/typeorm/ProductUnitOfWork';
import {
  AllocateCommand,
  ChangeBatchQuantityCommand,
  CreateBatchCommand
} from '../../src/allocation/domain/commands';
import { allocations } from '../../src/allocation/reads';
import { handle } from '../../src/allocation/services/messagebus';

describe('Views', () => {
  const today = new Date();
  beforeAll(async () => await db.create());
  afterAll(async () => await db.close());
  beforeEach(async () => await db.clear());

  it('adds to allocations view', async () => {
    const createBatch1 = new CreateBatchCommand({
      ref: 'sku1-batch',
      sku: 'sku1',
      qty: 50
    });
    const createBatch2 = new CreateBatchCommand({
      ref: 'sku2-batch',
      sku: 'sku2',
      qty: 50,
      eta: today
    });
    const allocate1 = new AllocateCommand({
      orderId: 'order',
      sku: 'sku1',
      qty: 20
    });
    const allocate2 = new AllocateCommand({
      orderId: 'order',
      sku: 'sku2',
      qty: 20
    });

    const createBatchLater = new CreateBatchCommand({
      ref: 'sku1batch-later',
      sku: 'sku1',
      qty: 50,
      eta: today
    });
    const otherAllocate1 = new AllocateCommand({
      orderId: 'other-order',
      sku: 'sku1',
      qty: 35
    });
    const otherAllocate2 = new AllocateCommand({
      orderId: 'other-order',
      sku: 'sku2',
      qty: 10
    });

    const uow = new ProductUnitOfWork();
    await handle(createBatch1, uow);
    await handle(createBatch2, uow);
    await handle(allocate1, uow);
    await handle(allocate2, uow);
    await handle(createBatchLater, uow);
    await handle(otherAllocate1, uow);
    await handle(otherAllocate2, uow);

    const orders = await allocations('order');
    expect(orders).toIncludeAllMembers([
      expect.objectContaining({
        orderId: 'order',
        sku: 'sku1',
        batchRef: 'sku1-batch'
      }),
      expect.objectContaining({
        orderId: 'order',
        sku: 'sku2',
        batchRef: 'sku2-batch'
      })
    ]);
  });

  it('removes from allocations view', async () => {
    const createBatch1 = new CreateBatchCommand({
      ref: 'b1',
      sku: 'sku1',
      qty: 50
    });
    const createBatch2 = new CreateBatchCommand({
      ref: 'b2',
      sku: 'sku1',
      qty: 50,
      eta: today
    });
    const allocate1 = new AllocateCommand({
      orderId: 'o1',
      sku: 'sku1',
      qty: 40
    });

    const changeBatchQuantity = new ChangeBatchQuantityCommand({
      ref: 'b1',
      qty: 10
    });

    const uow = new ProductUnitOfWork();
    await handle(createBatch1, uow);
    await handle(createBatch2, uow);
    await handle(allocate1, uow);
    await handle(changeBatchQuantity, uow);

    const orders = await allocations('o1');

    expect(orders[0]).toMatchObject({
      orderId: 'o1',
      sku: 'sku1',
      batchRef: 'b2'
    });
  });
});
