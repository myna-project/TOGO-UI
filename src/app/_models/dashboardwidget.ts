import { GridsterItem } from 'angular-gridster2';

import { DashboardWidgetDetail } from './dashboardwidgetdetail';
import { DrainControl } from './draincontrol';
import { Index } from './index';

export class DashboardWidget implements GridsterItem {
  dashboard_id: number;
  cols: number;
  rows: number;
  x: number;
  y: number;
  id: number;
  n_cols: number;
  n_rows: number;
  x_pos: number;
  y_pos: number;
  widget_type: string;
  costs_drain_id: number;
  interval_seconds: number;
  title: string;
  background_color: string;
  number_periods: number;
  period: string;
  start_time: string;
  legend: boolean;
  legend_position: string;
  legend_layout: string;
  navigator: boolean;
  time_aggregation: string;
  costs_aggregation: string;
  min_value: number;
  max_value: number;
  warning_value: number;
  alarm_value: number;
  color1: string;
  color2: string;
  color3: string;
  height: number;
  width: number;
  type: string;
  drains: string;
  drain_ids: string;
  formula_ids: string;
  indices: Index[];
  aggregations: string;
  operations: string;
  last_operator: string;
  units: string[];
  y_axis: any;
  series: any;
  serie_names: string[];
  color_axis: any;
  plot_options: any;
  chart: any;
  value: number;
  unit: string;
  decimals: number;
  plot_bands: any[];
  gauge: any;
  drain_control: DrainControl;
  alert_n: number;
  warning_n: number;
  ok_n: number;
  is_loading_drain: boolean;
  is_loading_index: boolean;
  is_loading_control: boolean;
  interval: any;
  error: string;
  last_updated: string;
  details: DashboardWidgetDetail[];
  drain_details: DashboardWidgetDetail[];
}
