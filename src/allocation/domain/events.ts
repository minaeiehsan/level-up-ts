export class Event {}

export class OutOfStockEvent extends Event {
  sku: string;
  constructor(props: OutOfStockEvent) {
    super();
    this.sku = props.sku;
  }
}

export class AllocatedEvent extends Event {
  sku: string;
  orderId: string;
  qty: number;
  batchRef: string;
  constructor(props: AllocatedEvent) {
    super();
    this.sku = props.sku;
    this.orderId = props.orderId;
    this.qty = props.qty;
    this.batchRef = props.batchRef;
  }
}

export class DeallocatedEvent extends Event {
  sku: string;
  orderId: string;
  qty: number;
  constructor(props: DeallocatedEvent) {
    super();
    this.sku = props.sku;
    this.orderId = props.orderId;
    this.qty = props.qty;
  }
}
