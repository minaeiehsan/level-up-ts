import { Connection, createConnection, getConnection } from 'typeorm';

export const db = {
  async create(): Promise<Connection> {
    return createConnection();
  },

  async close(): Promise<void> {
    await getConnection().close();
  },

  async clear(): Promise<void> {
    const query = [
      'allocations',
      'batches',
      'order_lines',
      'products',
      'allocations_view'
    ]
      .map((entity) => `DELETE FROM ${entity};`)
      .join('');
    await getConnection().query(query);
  },

  async setupMigration(): Promise<void> {
    const connection = await createConnection();
    await connection.runMigrations();
    await connection.close();
  }
};
