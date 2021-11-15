import { send } from '../adapters/email';
import { Batch } from '../domain/Batch';
import {
  AllocatedEvent,
  DeallocatedEvent,
  OutOfStockEvent
} from '../domain/events';
import {
  AllocateCommand,
  CreateBatchCommand,
  ChangeBatchQuantityCommand
} from '../domain/commands';
import { OrderLine } from '../domain/OrderLine';
import { OutOfStockError, Product } from '../domain/Product';
import { AbstractProductUnitOfWork } from '../domain/AbstractUnitOfWork';
import { publish } from '../adapters/rabbitmq';
import { AllocationViewEntity } from '../adapters/typeorm/entities/AllocationView';
import { getRepository } from 'typeorm';

export const EXCHANGE_TOPICS = {
  CHANGE_BATCH_QUANTITY: 'change_batch_quantity',
  ORDER_LINE_ALLOCATED: 'line_allocated'
};

export class InvalidSkuError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidSkuError.prototype);
  }
}

export const addBatch = async (
  message: CreateBatchCommand,
  uow: AbstractProductUnitOfWork
): Promise<void> => {
  await uow.start();

  const work = async () => {
    let product = await uow.products.get(message.sku);

    if (!product) {
      product = Product.create({
        sku: message.sku
      });
    }

    product.batches.push(
      Batch.create({
        reference: message.ref,
        qty: message.qty,
        sku: message.sku,
        eta: message.eta
      })
    );

    await uow.products.add(product);
  };

  await uow.commit(work);
};

export const allocate = async (
  message: AllocateCommand,
  uow: AbstractProductUnitOfWork
): Promise<string> => {
  await uow.start();

  let reference: string;
  const work = async () => {
    const product = await uow.products.get(message.sku);
    const orderLine = OrderLine.create(message);
    if (!product) {
      throw new InvalidSkuError(`Invalid Sku ${message.sku}`);
    }
    const batch = product.allocate(orderLine);
    await uow.products.add(product);
    reference = batch?.reference;
  };
  await uow.commit(work);

  return reference;
};

export const reallocate = async (
  message: DeallocatedEvent,
  uow: AbstractProductUnitOfWork
): Promise<void> => {
  await allocate(
    new AllocateCommand({
      orderId: message.orderId,
      sku: message.sku,
      qty: message.qty
    }),
    uow
  );
};

export const changeBatchQuantity = async (
  message: ChangeBatchQuantityCommand,
  uow: AbstractProductUnitOfWork
): Promise<void> => {
  await uow.start();
  const work = async () => {
    const product = await uow.products.getByBatchRef(message.ref);
    if (!product) {
      throw new OutOfStockError(`out of stock for batch ref ${message.ref}`);
    }
    product.changeBatchQuantity(message.ref, message.qty);
  };
  await uow.commit(work);
};

export const sendOutOfStockNotification = async (
  message: OutOfStockEvent
): Promise<void> => {
  const email = {
    from: 'from@example.com',
    to: 'to@example.com',
    subject: `out of stock email: ${message.sku}`,
    text: `Sku: ${message.sku} is out of stock`
  };
  await send(email);
};

export const publishAllocatedEvent = async (
  message: AllocatedEvent
): Promise<void> => {
  await publish(EXCHANGE_TOPICS.ORDER_LINE_ALLOCATED, message);
};

export const addAllocationToReadModel = async (
  message: AllocatedEvent
): Promise<void> => {
  const entity = new AllocationViewEntity();
  entity.batchRef = message.batchRef;
  entity.orderId = message.orderId;
  entity.sku = message.sku;
  await entity.save();
};

export const removeFromAllocationReadModel = async (
  message: DeallocatedEvent
): Promise<void> => {
  await getRepository(AllocationViewEntity).delete({
    orderId: message.orderId,
    sku: message.sku
  });
};
