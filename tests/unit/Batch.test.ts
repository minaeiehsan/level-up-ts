import { Batch, BatchProps } from '../../src/allocation/domain/Batch';
import { OrderLine } from '../../src/allocation/domain/OrderLine';

const makeBatchAndLine = (
  sku: string,
  batchQty: number,
  lineQty: number
): { batch: Batch; orderLine: OrderLine } => {
  return {
    batch: Batch.create({
      reference: 'batch-001',
      sku,
      qty: batchQty,
      eta: new Date()
    }),
    orderLine: OrderLine.create({ orderId: 'order-123', sku, qty: lineQty })
  };
};
describe('Batch', () => {
  it('reduces the available quantity when allocating to a batch', () => {
    const batchProps: BatchProps = {
      reference: 'batch-001',
      sku: 'SMALL-TABLE',
      qty: 20,
      eta: new Date()
    };
    const batch = Batch.create(batchProps);

    const line = OrderLine.create({
      orderId: 'order-ref',
      sku: 'SMALL-TABLE',
      qty: 2
    });

    batch.allocate(line);

    expect(batch.availableQuantity).toEqual(18);
  });

  it('allocates if available greater than required', () => {
    const { batch: largeBatch, orderLine: smallLine } = makeBatchAndLine(
      'ELEGANT-LAMP',
      20,
      2
    );

    expect(largeBatch.canAllocate(smallLine)).toBe(true);
  });

  it('does not allocate if available is smaller than required', () => {
    const { batch: smallBatch, orderLine: largeOrderLine } = makeBatchAndLine(
      'ELEGANT-LAMP',
      2,
      20
    );

    expect(smallBatch.canAllocate(largeOrderLine)).toBe(false);
  });

  it('allocates if available is equal required', () => {
    const { batch, orderLine } = makeBatchAndLine('ELEGANT-LAMP', 2, 2);

    expect(batch.canAllocate(orderLine)).toBe(true);
  });

  it('does not allocate if skus do not match', () => {
    const batch = Batch.create({
      reference: 'batch-001',
      sku: 'UNCOMFORTABLE-CHAIR',
      qty: 100,
      eta: new Date()
    });

    const diffSkuOrderLine = OrderLine.create({
      orderId: 'order-123',
      sku: 'EXPENSIVE-TOASTER',
      qty: 10
    });

    expect(batch.canAllocate(diffSkuOrderLine)).toBe(false);
  });

  it('allocates in idempotent way', () => {
    const { batch, orderLine } = makeBatchAndLine('ANGULAR-DESK', 20, 2);

    batch.allocate(orderLine);
    batch.allocate(orderLine);

    expect(batch.availableQuantity).toEqual(18);
  });

  it('deAllocates', () => {
    const { batch, orderLine } = makeBatchAndLine('EXPENSIVE-FOOTSTOOL', 20, 2);

    batch.allocate(orderLine);
    batch.deAllocates(orderLine);

    expect(batch.availableQuantity).toEqual(20);
  });

  it('deAllocates only allocated line', () => {
    const { batch, orderLine } = makeBatchAndLine('EXPENSIVE-FOOTSTOOL', 20, 2);

    batch.deAllocates(orderLine);

    expect(batch.availableQuantity).toEqual(20);
  });
});
