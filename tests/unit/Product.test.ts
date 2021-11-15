import { Batch } from '../../src/allocation/domain/Batch';
import { OrderLine } from '../../src/allocation/domain/OrderLine';
import { Product } from '../../src/allocation/domain/Product';

describe('Product', () => {
  const today = new Date();
  const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  const later = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
  it('prefers warehouse batches to shipments', () => {
    const sku = 'RETRO-CLOCK';
    const inStockBatch = Batch.create({
      reference: 'in-stock-batch',
      sku: 'RETRO-CLOCK',
      qty: 100
    });

    const shipmentBatch = Batch.create({
      reference: 'shipment-batch',
      sku,
      qty: 100,
      eta: tomorrow
    });

    const orderLine = OrderLine.create({
      orderId: 'orderId',
      sku,
      qty: 10
    });
    const product = Product.create({
      sku,
      batches: [inStockBatch, shipmentBatch]
    });

    product.allocate(orderLine);

    expect(inStockBatch.availableQuantity).toEqual(90);
    expect(shipmentBatch.availableQuantity).toEqual(100);
  });

  it('prefers earlier batches', () => {
    const sku = 'MINIMALIST-SPOON';
    const earliest = Batch.create({
      reference: 'speedy-batch',
      sku,
      qty: 100,
      eta: today
    });

    const medium = Batch.create({
      reference: 'normal-batch',
      sku,
      qty: 100,
      eta: tomorrow
    });

    const latest = Batch.create({
      reference: 'normal-batch',
      sku,
      qty: 100,
      eta: later
    });

    const orderLine = OrderLine.create({
      orderId: 'orderId',
      sku,
      qty: 10
    });
    const product = Product.create({
      sku,
      batches: [medium, earliest, latest]
    });

    product.allocate(orderLine);

    expect(earliest.availableQuantity).toEqual(90);
    expect(medium.availableQuantity).toEqual(100);
    expect(latest.availableQuantity).toEqual(100);
  });

  it('returns allocated batch reference', () => {
    const sku = 'HIGHBROW-POSTER';
    const inStockBatch = Batch.create({
      reference: 'in-stock-batch-ref',
      sku,
      qty: 100
    });

    const shipmentBatch = Batch.create({
      reference: 'shipment-batch-ref',
      sku,
      qty: 100,
      eta: tomorrow
    });

    const orderLine = OrderLine.create({
      orderId: 'orderId',
      sku,
      qty: 10
    });

    const product = Product.create({
      sku,
      batches: [inStockBatch, shipmentBatch]
    });

    const allocation = product.allocate(orderLine);

    expect(allocation.reference).toEqual(inStockBatch.reference);
  });

  it('raises out of stock exception if cannot allocate', () => {
    const sku = 'SMALL-FORK';
    const batch = Batch.create({
      reference: 'batch1',
      sku,
      qty: 10,
      eta: today
    });

    const product = Product.create({
      sku,
      batches: [batch]
    });

    product.allocate(
      OrderLine.create({ orderId: 'orderId', sku: 'SMALL-FORK', qty: 10 })
    );

    expect(
      product.allocate(
        OrderLine.create({ orderId: 'orderId', sku: 'SMALL-FORK', qty: 10 })
      )
    ).toBeUndefined();
  });

  it('increments version number', () => {
    const orderLine = OrderLine.create({
      orderId: 'oref',
      sku: 'SCANDI-PEN',
      qty: 10
    });
    const sku = 'SMALL-FORK';
    const batch = Batch.create({
      reference: 'b1',
      sku: 'SCANDI-PEN',
      qty: 100
    });

    const product = Product.create({
      sku,
      batches: [batch],
      versionNumber: 7
    });

    product.allocate(OrderLine.create(orderLine));

    expect(product.versionNumber).toEqual(8);
  });
});
