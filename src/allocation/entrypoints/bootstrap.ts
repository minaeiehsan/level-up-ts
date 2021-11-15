import 'reflect-metadata';
import '../config';

import { container } from 'tsyringe';
import { ProductUnitOfWork } from '../adapters/typeorm/ProductUnitOfWork';

export const register = (): void => {
  container.register('AbstractProductUnitOfWork', {
    useClass: ProductUnitOfWork
  });
};
