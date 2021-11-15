import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'allocations_view' })
export class AllocationViewEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: string;

  @Column()
  sku: string;

  @Column()
  batchRef: string;
}
