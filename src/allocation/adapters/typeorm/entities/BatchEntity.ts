import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { BatchProps } from '../../../domain/Batch';
import { OrderLineEntity } from './OrderLineEntity';

@Entity({ name: 'batches' })
export class BatchEntity extends BaseEntity implements BatchProps {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reference: string;

  @Column()
  sku: string;

  @Column()
  qty: number;

  @Column({ nullable: true })
  eta?: Date;

  @Column({ nullable: true })
  purchasedQuantity?: number;

  @ManyToMany(() => OrderLineEntity)
  @JoinTable({
    name: 'allocations',
    joinColumn: {
      name: 'batchId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'orderLineId',
      referencedColumnName: 'id'
    }
  })
  allocations?: OrderLineEntity[];
}
