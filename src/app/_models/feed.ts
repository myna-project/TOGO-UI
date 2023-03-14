import { Drain } from './drain';

export class Feed {
  id: number;
  description: string;
  client_ids: number[];
  drains: Drain[];
}
