import { IndexGroup } from './indexgroup';

export class Index {
  id: number;
  name: string;
  org_id: number;
  group: IndexGroup;
  coefficient: number;
  measure_unit: string;
  decimals: number;
  min_value: number;
  max_value: number;
  warning_value: number;
  alarm_value: number;
  formula_elements: any[];
  operators: string[];
  result: any[];
  selected: boolean;
}
