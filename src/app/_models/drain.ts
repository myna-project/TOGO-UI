import { DrainControlDetail } from './draincontroldetail';

export class Drain {
  id: number;
  feed_id: number;
  name: string;
  measure_id: string;
  measure_unit: string;
  type: string;
  measure_type: string;
  decimals: number;
  client_default_drain: boolean;
  min_value: number;
  max_value: number;
  positive_negative_value: boolean;
  base_drain_id: number;
  coefficient: number;
  diff_drain_id: number;
  controls: DrainControlDetail[];
  selected: boolean;
}
