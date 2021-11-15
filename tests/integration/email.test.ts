import {
  AllocateCommand,
  CreateBatchCommand
} from '../../src/allocation/domain/commands';
import mailhog from 'mailhog';
import { ProductUnitOfWork } from '../../src/allocation/adapters/typeorm/ProductUnitOfWork';
import { handle } from '../../src/allocation/services/messagebus';
import { db } from '../support';

const mailhogClient = mailhog({
  port: 18025
});

describe('Email', () => {
  beforeAll(async () => {
    await db.create();
    await mailhogClient.deleteAll();
  });
  afterAll(async () => await db.close());
  beforeEach(async () => await db.clear());

  it('sends out of stock email', async () => {
    const sku = 'sku';
    const createBatch = new CreateBatchCommand({
      ref: 'batch1',
      sku,
      qty: 9
    });

    const allocate = new AllocateCommand({
      orderId: 'order',
      sku,
      qty: 10
    });

    const uow = new ProductUnitOfWork();
    await handle(createBatch, uow);
    await handle(allocate, uow);
    await new Promise((_) => setTimeout(_, 1000));

    const email = await mailhogClient.search(sku);

    expect(email.items[0]).toMatchObject({
      from: 'from@example.com',
      to: 'to@example.com',
      subject: `out of stock email: ${sku}`,
      text: `Sku: ${sku} is out of stock`
    });
  });
});
