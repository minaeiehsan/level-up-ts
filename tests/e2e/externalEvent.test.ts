import { db } from '../support';
import supertest from 'supertest';
import { createHttpServer } from '../../src/allocation/entrypoints/http';
import * as rabbitmq from '../../src/allocation/adapters/rabbitmq/index';
import * as bootstrap from '../../src/allocation/entrypoints/bootstrap';
import { initSubscribers } from '../../src/allocation/entrypoints/message';
import { EXCHANGE_TOPICS } from '../../src/allocation/services/handlers';
describe('External Event', () => {
  let server, agent;

  beforeAll(async () => {
    bootstrap.register();
    await db.create();
    await rabbitmq.connect();
    await initSubscribers();
    await rabbitmq.purgeQueue();
    server = createHttpServer().listen(4000, () => {
      agent = supertest.agent(server);
    });
  });

  afterAll(async () => {
    await server.close();
    await rabbitmq.disconnect();
    await db.close();
  });

  beforeEach(async () => await db.clear());

  it('changes batch quantity leading to reallocation', async () => {
    const sku = 'sku';
    const earlyBatch = 'earlyBatch';
    const laterBatch = 'laterBatch';
    const orderId = 'random-orderId';
    await agent.post('/batches').send({
      reference: earlyBatch,
      sku,
      qty: 10,
      eta: new Date('2020-01-01')
    });
    await agent.post('/batches').send({
      reference: laterBatch,
      sku,
      qty: 10,
      eta: new Date('2020-01-02')
    });
    await agent.post('/allocate').send({
      orderId,
      sku,
      qty: 10
    });

    const messages = [];
    await rabbitmq.subscribe(EXCHANGE_TOPICS.ORDER_LINE_ALLOCATED, (msg) => {
      messages.push(msg);
    });
    await rabbitmq.publish(EXCHANGE_TOPICS.CHANGE_BATCH_QUANTITY, {
      ref: earlyBatch,
      qty: 5,
      sku
    });

    await new Promise((_) => setTimeout(_, 1000));
    expect(messages[messages.length - 1]).toMatchObject({
      sku: 'sku',
      orderId: 'random-orderId',
      qty: 10,
      batchRef: 'laterBatch'
    });
  });
});
