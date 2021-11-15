import supertest from 'supertest';
import { Express } from 'express';
import { createHttpServer } from '../../src/allocation/entrypoints/http';
import { db } from '../support';
import * as rabbitmq from '../../src/allocation/adapters/rabbitmq';
import { initSubscribers } from '../../src/allocation/entrypoints/message';
import * as bootstrap from '../../src/allocation/entrypoints/bootstrap';
describe('API test', () => {
  let app: Express;

  beforeAll(async () => {
    bootstrap.register();
    await db.create();
    await rabbitmq.connect();
    await initSubscribers();
    app = createHttpServer();
  });

  afterAll(async () => {
    await rabbitmq.disconnect();
    await db.close();
  });

  beforeEach(async () => await db.clear());

  it('returns 400 on invalid sku', async () => {
    const res = await supertest(app).post('/allocate').send({
      orderId: 'random-orderId',
      sku: 'random-sku',
      qty: 20
    });

    expect(res.status).toEqual(400);
    expect(res.text).toEqual('Invalid Sku random-sku');
  });

  it('returns 202 and allocated batch', async () => {
    const sku = 'sku';
    const otherSku = 'other-sku';
    const orderId = 'random-orderId';
    const earlyBatch = 'batch-1';
    const laterBatch = 'batch-2';
    const otherBatch = 'batch-3';

    await supertest(app)
      .post('/batches')
      .send({
        reference: laterBatch,
        sku,
        qty: 100,
        eta: new Date('2020-01-02')
      });
    await supertest(app)
      .post('/batches')
      .send({
        reference: earlyBatch,
        sku,
        qty: 100,
        eta: new Date('2020-01-01')
      });
    await supertest(app).post('/batches').send({
      reference: otherBatch,
      sku: otherSku,
      qty: 100,
      eta: null
    });

    const allocateResponse = await supertest(app).post('/allocate').send({
      orderId,
      sku,
      qty: 3
    });

    expect(allocateResponse.status).toEqual(202);

    const res = await supertest(app).get(`/allocations/${orderId}`);
    expect(res.body[0]).toMatchObject({
      orderId,
      sku,
      batchRef: earlyBatch
    });
  });
});
