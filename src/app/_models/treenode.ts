export class TreeItemNode {
  id: number;
  item: string;
  full_name: string;
  type: string;
  subtype: string;
  code: string;
  default_drain_ids: number[];
  formula_ids: number[];
  client_default_drain: boolean;
  alert: boolean;
  alarm: boolean;
  warning: boolean;
  children: TreeItemNode[];
  has_details: boolean;
  view_details: boolean;
  expanded: boolean;
  is_loading: boolean;
}

export class TreeItemFlatNode {
  id: number;
  item: string;
  full_name: string;
  type: string;
  subtype: string;
  code: string;
  default_drain_ids: number[];
  formula_ids: number[];
  client_default_drain: boolean;
  alert: boolean;
  alarm: boolean;
  warning: boolean;
  level: number;
  expandable: boolean;
  has_details: boolean;
  view_details: boolean;
  expanded: boolean;
  is_loading: boolean;
}
