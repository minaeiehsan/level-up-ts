export class OrderLine {
  id?: number;
  orderId: string;
  sku: string;
  qty: number;

  private constructor(props: OrderLine) {
    this.id = props.id;
    this.orderId = props.orderId;
    this.sku = props.sku;
    this.qty = props.qty;
  }

  static create(props: OrderLine): OrderLine {
    return new OrderLine(props);
  }
}
