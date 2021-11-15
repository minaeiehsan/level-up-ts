import dotenv from 'dotenv';
import { env } from './env';
dotenv.config();

export const CONFIG = {
  HTTP: {
    PORT: env('HTTP_PORT').asInt()
  },
  EMAIL: {
    HOST: env('EMAIL_HOST').asString(),
    PORT: env('EMAIL_PORT').asInt()
  },
  AMQP: {
    URI: env('AMQP_URI').asString(),
    EXCHANGE_TYPE: env('AMQP_EXCHANGE_TYPE').asString(),
    NO_ACK: env('AMQP_NO_ACK').asBool(),
    DURABLE: env('AMQP_DURABLE').asBool(),
    PERSISTENT: env('AMQP_PERSISTENT').asBool()
  }
};
