import { Connection, createConnection, getConnection } from 'typeorm';

export const db = {
  async connect(): Promise<Connection> {
    return createConnection();
  },

  async disconnect(): Promise<void> {
    await getConnection().close();
  }
};
