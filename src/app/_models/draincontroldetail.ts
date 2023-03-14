export class DrainControlDetail {
  id: number;
  type: string;
  drain_id: number;
  formula_id: number;
  last_minutes: number;
  aggregation: string;
  low_threshold: number;
  high_threshold: number;
  delta: number;
  active: boolean;
  waiting_measures: number;
  error: boolean;
  last_error_time: string;
}
