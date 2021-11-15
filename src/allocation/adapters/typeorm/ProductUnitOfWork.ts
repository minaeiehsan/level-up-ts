import { EntityManager, getConnection, QueryRunner } from 'typeorm';
import { ProductRepository } from './ProductRepository';
import { AbstractProductRepository } from '../../domain/AbstractRepository';
import { AbstractProductUnitOfWork } from '../../domain/AbstractUnitOfWork';
import { logger } from '../logger';
import { Event } from '../../domain/events';
import { Command } from '../../domain/commands';

export class ProductUnitOfWork implements AbstractProductUnitOfWork {
  private runner: QueryRunner;
  private manager: EntityManager;

  public products: AbstractProductRepository;

  *collectNewInputs(): IterableIterator<Event | Command> {
    for (const product of this.products.seen) {
      while (product.events.length) {
        yield product.events.pop();
      }
    }
  }

  async start(): Promise<void> {
    this.runner = getConnection().createQueryRunner();
    await this.runner.startTransaction();
    this.manager = this.runner.manager;
    this.products = this.getRepository(ProductRepository);
  }

  getRepository<T>(R: new (manager: EntityManager) => T): T {
    if (!this.manager) {
      throw new Error('Unit of work is not started. Call the start() method');
    }
    return new R(this.manager);
  }

  async commit(work: () => void): Promise<void> {
    try {
      await work();
      await this.runner.commitTransaction();
    } catch (error) {
      logger.log('uow error:', error);
      await this.runner.rollbackTransaction();
      throw error;
    } finally {
      await this.runner.release();
    }
  }
}
