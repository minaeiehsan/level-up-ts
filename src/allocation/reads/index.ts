import { getRepository } from 'typeorm';
import { AllocationViewEntity } from '../adapters/typeorm/entities/AllocationView';

export const allocations = (
  orderId: string
): Promise<AllocationViewEntity[]> => {
  return getRepository(AllocationViewEntity).find({ orderId });
};
