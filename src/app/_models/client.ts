export class Client {
  id: number;
  name: string;
  category_id: number;
  parent_id: number;
  controller_id: number;
  org_id: number;
  type: string;
  computer_client: boolean;
  energy_client: boolean;
  device_id: string;
  image: string;
  active: boolean;
  child_ids: number[];
  controlled_ids: number[];
  feed_ids: number[];
  default_drain_ids: number[];
  formula_ids: number[];
  alert: boolean;
  alarm: boolean;
  warning: boolean;
}
