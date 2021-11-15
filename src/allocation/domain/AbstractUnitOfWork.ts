import { AbstractProductRepository } from './AbstractRepository';
import { Command } from './commands';
import { Event } from './events';

export interface AbstractProductUnitOfWork {
  collectNewInputs(): IterableIterator<Event | Command>;
  products: AbstractProductRepository;
  start(): Promise<void>;
  commit(work: () => void): void;
}
