import express, { Request, Response, Express } from 'express';
import { InvalidSkuError } from '../services/handlers';
import { OutOfStockError } from '../domain/Product';
import { ProductUnitOfWork } from '../adapters/typeorm/ProductUnitOfWork';
import * as bus from '../services/messagebus';
import { AllocateCommand, CreateBatchCommand } from '../domain/commands';
import * as reads from '../reads';
import { container } from 'tsyringe';
import { AddBatchHandler } from '../services/handlers/AddBatchHandler';

export const createHttpServer = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.post('/allocate', async (req: Request, res: Response) => {
    const uow = new ProductUnitOfWork();
    const cmd = new AllocateCommand({
      orderId: req.body.orderId,
      sku: req.body.sku,
      qty: req.body.qty
    });

    try {
      await bus.handle(cmd, uow);
      return res.sendStatus(202);
    } catch (e) {
      if (e instanceof OutOfStockError || e instanceof InvalidSkuError) {
        return res.status(400).send(e.message);
      }
      throw e;
    }
  });

  app.post('/batches', async (req: Request, res: Response) => {
    const handler = container.resolve(AddBatchHandler);
    const cmd = new CreateBatchCommand({
      ref: req.body.reference,
      sku: req.body.sku,
      qty: req.body.qty,
      eta: req.body.eta
    });
    try {
      await handler.handle(cmd);
      return res.sendStatus(201);
    } catch (e) {
      return res.status(400).send(e.message);
    }
  });

  app.get('/allocations/:orderId', async (req: Request, res: Response) => {
    const result = await reads.allocations(req.params.orderId);
    res.json(result);
  });

  return app;
};
