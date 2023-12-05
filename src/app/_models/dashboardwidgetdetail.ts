export class DashboardWidgetDetail {
  id: number;
  index_id: number;
  drain_id: number;
  formula_id: number;
  drain_control_id: number;
  aggregations: string[];
  aggregation: string;
  operators: string[];
  operator: string;
  full_name: string;
  divider: boolean;
  visible: boolean;
  disabled_sub_formula: boolean;
  is_positive_negative_value: boolean;
  positive_negative_value: string;
}
