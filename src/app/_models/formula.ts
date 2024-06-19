export class Formula {
  id: number;
  name: string;
  org_id: number;
  client_id: number;
  components: number[];
  aggregations: string[];
  operators: string[];
  legends: string[];
  positive_negative_values: string[];
  exclude_outliers: string[];
  selected: boolean;
}
