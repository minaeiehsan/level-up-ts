import { Batch } from './Batch';
import { Command } from './commands';
import {
  AllocatedEvent,
  DeallocatedEvent,
  Event,
  OutOfStockEvent
} from './events';
import { OrderLine } from './OrderLine';

export class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OutOfStockError.prototype);
  }
}

export interface ProductProps {
  id?: number;
  sku: string;
  batches?: Batch[];
  versionNumber?: number;
  events?: Array<Event | Command>;
}
export class Product implements ProductProps {
  private props: ProductProps;
  private _versionNumber: number;
  private _batches: Batch[];
  events: Array<Event | Command>;

  private constructor(props: ProductProps) {
    this.props = props;
    this._versionNumber = this.props.versionNumber || 0;
    this._batches = this.props.batches || [];
    this.events = [];
  }

  static create(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): number {
    return this.props.id;
  }

  get batches(): Batch[] {
    return this._batches;
  }

  get sku(): string {
    return this.props.sku;
  }

  get versionNumber(): number {
    return this._versionNumber;
  }

  allocate(orderLine: OrderLine): Batch {
    const sortedBatches = this._batches.sort(this.sortBatchesByAscendingEta);

    for (const batch of sortedBatches) {
      if (batch.canAllocate(orderLine)) {
        batch.allocate(orderLine);

        this._versionNumber += 1;
        this.events.push(
          new AllocatedEvent({
            batchRef: batch.reference,
            orderId: orderLine.orderId,
            sku: orderLine.sku,
            qty: orderLine.qty
          })
        );

        return batch;
      }
    }
    this.events.push(
      new OutOfStockEvent({
        sku: orderLine.sku
      })
    );
    return;
  }

  changeBatchQuantity(reference: string, qty: number): void {
    const batch = this._batches.find((batch) => batch.reference === reference);
    batch.purchasedQuantity = qty;
    while (batch.availableQuantity < 0) {
      const orderLine = batch.deAllocateOne();

      this.events.push(
        new DeallocatedEvent({
          qty: orderLine.qty,
          sku: orderLine.sku,
          orderId: orderLine.orderId
        })
      );
    }
  }

  private sortBatchesByAscendingEta(batch1: Batch, batch2: Batch): number {
    if (batch1.eta === undefined) {
      return -1;
    }

    if (batch2.eta === undefined) {
      return 1;
    }

    return batch1.eta >= batch2.eta ? 1 : -1;
  }
}
