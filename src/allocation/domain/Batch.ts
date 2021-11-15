import { OrderLine } from './OrderLine';

export interface BatchProps {
  id?: number;
  reference: string;
  sku: string;
  qty: number;
  eta?: Date;
  purchasedQuantity?: number;
  allocations?: OrderLine[];
}

export class Batch implements BatchProps {
  private props: BatchProps;
  private _purchasedQuantity: number;
  private _allocations: Set<OrderLine>;

  private constructor(props: BatchProps) {
    this.props = props;
    this._purchasedQuantity = Number.isInteger(props.purchasedQuantity)
      ? props.purchasedQuantity
      : props.qty;
    this._allocations = new Set(props.allocations || []);
  }

  static create(props: BatchProps): Batch {
    return new Batch(props);
  }

  get id(): number {
    return this.props.id;
  }

  get qty(): number {
    return this.props.qty;
  }

  get sku(): string {
    return this.props.sku;
  }

  get eta(): Date | undefined {
    return this.props.eta;
  }

  get reference(): string {
    return this.props.reference;
  }

  get allocations(): OrderLine[] {
    return [...this._allocations];
  }

  get allocatedQuantity(): number {
    return [...this._allocations].reduce(
      (sum, allocation) => sum + allocation.qty,
      0
    );
  }

  get availableQuantity(): number {
    return this._purchasedQuantity - this.allocatedQuantity;
  }

  get purchasedQuantity(): number {
    return this.availableQuantity;
  }

  set purchasedQuantity(value: number) {
    this._purchasedQuantity = value;
  }

  allocate(line: OrderLine): void {
    if (this.canAllocate(line)) {
      this._allocations.add(line);
    }
  }

  canAllocate(orderLine: OrderLine): boolean {
    return (
      this.props.sku == orderLine.sku && this.availableQuantity >= orderLine.qty
    );
  }

  deAllocateOne(): OrderLine {
    const [orderLine, ...rest] = [...this._allocations];
    this._allocations = new Set(rest);
    return orderLine;
  }

  deAllocates(orderLine: OrderLine): void {
    if (this._allocations.has(orderLine)) {
      this._allocations.delete(orderLine);
    }
  }
}
