import { Config } from '@jest/types';
import '../src/allocation/config';
import { db } from './support';

export default async (): Promise<Config.InitialOptions> => {
  await db.setupMigration();
  return {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['jest-extended'],
    setupFiles: ['./setup.ts']
  };
};
