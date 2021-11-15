export class Command {}

export class AllocateCommand extends Command {
  orderId: string;
  sku: string;
  qty: number;
  constructor(props: AllocateCommand) {
    super();
    this.orderId = props.orderId;
    this.sku = props.sku;
    this.qty = props.qty;
  }
}

export class CreateBatchCommand extends Command {
  ref: string;
  sku: string;
  qty: number;
  eta?: Date;
  constructor(props: CreateBatchCommand) {
    super();
    this.ref = props.ref;
    this.sku = props.sku;
    this.qty = props.qty;
    this.eta = props.eta;
  }
}

export class ChangeBatchQuantityCommand extends Command {
  ref: string;
  qty: number;
  constructor(props: ChangeBatchQuantityCommand) {
    super();
    this.ref = props.ref;
    this.qty = props.qty;
  }
}
