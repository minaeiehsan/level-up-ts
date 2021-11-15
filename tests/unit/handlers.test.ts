import { handle } from '../../src/allocation/services/messagebus';
import { AbstractProductUnitOfWork } from '../../src/allocation/domain/AbstractUnitOfWork';
import {
  AllocateCommand,
  CreateBatchCommand
} from '../../src/allocation/domain/commands';
import { InvalidSkuError } from '../../src/allocation/services/handlers';
import { Product } from '../../src/allocation/domain/Product';
import { send as sendEmailMock } from '../../src/allocation/adapters/email';
import { AbstractProductRepository } from '../../src/allocation/domain/AbstractRepository';

jest.mock('../../src/allocation/adapters/email');
jest.mock('../../src/allocation/adapters/rabbitmq/index');

class FakeRepository implements AbstractProductRepository {
  private _products: Set<Product>;
  public seen: Set<Product>;

  constructor(products?: Product[]) {
    this._products = new Set(products || []);
    this.seen = new Set();
  }

  getByBatchRef(ref: string): Promise<Product> {
    return Promise.resolve(
      [...this._products].find((product) =>
        product.batches.find((batch) => batch.reference === ref)
      )
    );
  }

  add(product: Product): Promise<void> {
    this._products.add(product);
    this.seen.add(product);
    return;
  }

  get(sku: string): Promise<Product> {
    for (const product of this._products) {
      if (product.sku === sku) {
        this.seen.add(product);
        return Promise.resolve(product);
      }
    }
  }
}

class FakeUnitOfWork implements AbstractProductUnitOfWork {
  public products: AbstractProductRepository;

  constructor(products: Product[] = []) {
    this.products = new FakeRepository(products);
  }

  *collectNewInputs(): any {
    for (const product of this.products.seen) {
      while (product.events.length) {
        yield product.events.pop();
      }
    }
  }

  async start(): Promise<void> {
    return Promise.resolve();
  }

  async commit(work: () => void): Promise<void> {
    await work();
    return Promise.resolve();
  }
}

describe('Handlers', () => {
  describe('add batch', () => {
    it('adds a new product', async () => {
      const uow = new FakeUnitOfWork();
      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'sku1',
          qty: 100
        }),
        uow
      );

      const product = await uow.products.get('sku1');
      expect(product).toBeDefined();
      expect(product.batches[0].sku).toEqual('sku1');
      expect(product.batches[0].reference).toEqual('b1');
      expect(product.batches[0].qty).toEqual(100);
    });

    it('adds to existing product', async () => {
      const uow = new FakeUnitOfWork();

      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'sku1',
          qty: 100
        }),
        uow
      );

      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'sku1',
          qty: 99
        }),
        uow
      );

      const product = await uow.products.get('sku1');

      expect(product.batches).toHaveLength(2);
      expect(product.batches.reduce((sum, cur) => sum + cur.qty, 0)).toEqual(
        199
      );
    });
  });

  describe('allocation', () => {
    it('returns allocation', async () => {
      const uow = new FakeUnitOfWork();

      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'sku1',
          qty: 100
        }),
        uow
      );

      const [result] = await handle(
        new AllocateCommand({
          orderId: 'orderId',
          sku: 'sku1',
          qty: 10
        }),
        uow
      );

      expect(result).toEqual('b1');
    });

    it('throws on invalid sku', async () => {
      const uow = new FakeUnitOfWork();

      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'sku1',
          qty: 100
        }),
        uow
      );

      expect.assertions(2);

      try {
        await handle(
          new AllocateCommand({
            orderId: 'orderId',
            sku: 'NON-EXISTENT-SKU',
            qty: 10
          }),
          uow
        );
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidSkuError);
        expect(e.message).toEqual(`Invalid Sku NON-EXISTENT-SKU`);
      }
    });

    it('sends email on out of stock error', async () => {
      const uow = new FakeUnitOfWork();

      await handle(
        new CreateBatchCommand({
          ref: 'b1',
          sku: 'POPULAR-CURTAINS',
          qty: 9
        }),
        uow
      );

      await handle(
        new AllocateCommand({
          orderId: 'orderId',
          sku: 'POPULAR-CURTAINS',
          qty: 10
        }),
        uow
      );

      expect(sendEmailMock).toHaveBeenCalled();
    });
  });
});
