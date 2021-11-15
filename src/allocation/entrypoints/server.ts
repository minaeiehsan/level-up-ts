import * as bootstrap from './bootstrap';
import { db } from '../adapters/typeorm';
import * as q from '../adapters/rabbitmq';
import { createHttpServer } from './http';
import { initSubscribers } from './message';
import { logger } from '../adapters/logger';
import { CONFIG } from '../config';

const start = async () => {
  bootstrap.register();
  await db.connect();
  await q.connect();
  await initSubscribers();
  const server = createHttpServer();
  server.listen(CONFIG.HTTP.PORT, () => {
    logger.log(`Start listening on ${CONFIG.HTTP.PORT}`);
  });
};

start();
