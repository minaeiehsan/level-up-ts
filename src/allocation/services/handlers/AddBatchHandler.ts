import { Handler } from './Handler';
import { inject, injectable } from 'tsyringe';
import { CreateBatchCommand } from '../../domain/commands';
import { AbstractProductUnitOfWork } from '../../domain/AbstractUnitOfWork';
import { Product } from '../../domain/Product';
import { Batch } from '../../domain/Batch';

@injectable()
export class AddBatchHandler implements Handler {
  constructor(
    @inject('AbstractProductUnitOfWork') private uow: AbstractProductUnitOfWork
  ) {}

  async handle(message: CreateBatchCommand): Promise<void> {
    await this.uow.start();

    const work = async () => {
      let product = await this.uow.products.get(message.sku);

      if (!product) {
        product = Product.create({
          sku: message.sku
        });
      }

      product.batches.push(
        Batch.create({
          reference: message.ref,
          qty: message.qty,
          sku: message.sku,
          eta: message.eta
        })
      );

      await this.uow.products.add(product);
    };

    await this.uow.commit(work);
  }
}
