import { ChangeBatchQuantityCommand } from '../domain/commands';
import { handle } from '../services/messagebus';
import { ProductUnitOfWork } from '../adapters/typeorm/ProductUnitOfWork';
import { subscribe } from '../adapters/rabbitmq';
import { EXCHANGE_TOPICS } from '../services/handlers';

const handleChangeBatchQuantity = async (msg) => {
  const uow = new ProductUnitOfWork();
  const cmd = new ChangeBatchQuantityCommand({
    ref: msg.ref,
    qty: msg.qty
  });
  await handle(cmd, uow);
};

export const initSubscribers = async (): Promise<void> => {
  await subscribe(
    EXCHANGE_TOPICS.CHANGE_BATCH_QUANTITY,
    handleChangeBatchQuantity
  );
};
