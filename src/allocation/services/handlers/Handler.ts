import { Command } from '../../domain/commands';
import { Event } from '../../domain/events';

export interface Handler {
  handle(message: Command | Event): Promise<any>;
}
