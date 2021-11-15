import {
  OutOfStockEvent,
  AllocatedEvent,
  Event,
  DeallocatedEvent
} from '../domain/events';
import {
  CreateBatchCommand,
  AllocateCommand,
  ChangeBatchQuantityCommand,
  Command
} from '../domain/commands';
import * as handlers from '../services/handlers';
import { AbstractProductUnitOfWork } from '../domain/AbstractUnitOfWork';
import { logger } from '../adapters/logger';

const EVENT_HANDLERS = {
  [OutOfStockEvent.name]: [handlers.sendOutOfStockNotification],
  [AllocatedEvent.name]: [
    handlers.publishAllocatedEvent,
    handlers.addAllocationToReadModel
  ],
  [DeallocatedEvent.name]: [
    handlers.reallocate,
    handlers.removeFromAllocationReadModel
  ]
};
const COMMAND_HANDLERS = {
  [CreateBatchCommand.name]: handlers.addBatch,
  [AllocateCommand.name]: handlers.allocate,
  [ChangeBatchQuantityCommand.name]: handlers.changeBatchQuantity
};

export const handle = async (
  message: Command | Event,
  uow: AbstractProductUnitOfWork
): Promise<any[]> => {
  const results = [];
  const queue = [message];

  while (queue.length) {
    const lastMessage = queue.pop();

    if (lastMessage instanceof Event) {
      const handlers = EVENT_HANDLERS[lastMessage.constructor.name];
      for (const handler of handlers) {
        try {
          await handler(lastMessage as any, uow);
        } catch (e) {
          logger.log(`Can not handed Action: ${lastMessage}, error: ${e}`);
          continue;
        }
      }
    } else if (lastMessage instanceof Command) {
      const handler = COMMAND_HANDLERS[lastMessage.constructor.name];
      const res = await handler(lastMessage as any, uow);
      results.push(res);
    } else {
      throw new Error(`${message} was not an Event or Command`);
    }

    const nextMessage = uow.collectNewInputs().next();

    if (nextMessage.done === false) {
      queue.push(nextMessage.value);
    }
  }

  return results;
};
