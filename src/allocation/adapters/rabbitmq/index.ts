import amqp from 'amqplib';
import { CONFIG } from '../../config';
import { EXCHANGE_TOPICS } from '../../services/handlers';
import { logger } from '../logger';

let connection: amqp.Connection;
let pubChannel: amqp.ConfirmChannel;
let subChannel: amqp.ConfirmChannel;

export const connect = async (): Promise<void> => {
  connection = await amqp.connect(CONFIG.AMQP.URI);
  pubChannel = await connection.createConfirmChannel();
  subChannel = await connection.createConfirmChannel();
};

export const purgeQueue = async (): Promise<void> => {
  await pubChannel.purgeQueue(EXCHANGE_TOPICS.CHANGE_BATCH_QUANTITY);
};

export const disconnect = async (): Promise<void> => {
  await pubChannel.close();
  await subChannel.close();
  await connection.close();
};

export const publish = async (
  exchangeName: string,
  msg: Record<any, any>
): Promise<void> => {
  logger.log(`publishing to ${exchangeName}:`, msg);
  await pubChannel.assertExchange(exchangeName, CONFIG.AMQP.EXCHANGE_TYPE, {
    durable: CONFIG.AMQP.DURABLE
  });
  await pubChannel.publish(exchangeName, '', Buffer.from(JSON.stringify(msg)), {
    persistent: CONFIG.AMQP.PERSISTENT
  });
};

export const subscribe = async (
  exchangeName: string,
  cb: (content: Record<any, any>) => void
): Promise<void> => {
  await subChannel.assertExchange(exchangeName, CONFIG.AMQP.EXCHANGE_TYPE, {
    durable: CONFIG.AMQP.DURABLE
  });

  const { queue } = await subChannel.assertQueue(exchangeName, {
    exclusive: false,
    messageTtl: 5000
  });
  subChannel.bindQueue(queue, exchangeName, '');
  subChannel.consume(
    queue,
    async (msg) => {
      const content = JSON.parse(msg.content.toString());
      logger.log(`got from ${exchangeName}:`, content);
      try {
        await cb(content);
        subChannel.ack(msg);
      } catch (e) {
        subChannel.nack(msg);
      }
    },
    {
      noAck: CONFIG.AMQP.NO_ACK
    }
  );
};
