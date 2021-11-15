import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { OrderLine } from '../../../domain/OrderLine';
import { BatchEntity } from './BatchEntity';

@Entity({ name: 'order_lines' })
export class OrderLineEntity extends BaseEntity implements OrderLine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: string;

  @Column()
  sku: string;

  @Column()
  qty: number;

  @ManyToMany(() => BatchEntity, (batch) => batch.allocations)
  batches: BatchEntity[];
}
