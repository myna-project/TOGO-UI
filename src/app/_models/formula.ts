export class Formula {
  id: number;
  name: string;
  org_id: number;
  client_id: number;
  components: number[];
  aggregations: string[];
  operators: string[];
  legends: string[];
  drains: any[] = [];
  positive_negative_values: string[];
}
