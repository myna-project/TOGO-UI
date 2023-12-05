export class User {
  id: number;
  username: string;
  name: string;
  surname: string;
  old_password: string;
  password: string;
  enabled: boolean;
  email: string;
  avatar: string;
  lang: string;
  style: string;
  role_ids: number[];
  job_ids: number[];
  is_logged: boolean;
  is_admin: boolean;
  main_role: string;
  default_dashboard_id: number;
  dashboard_ids: number[];
  default_start: string;
  default_end: string;
  drain_tree_depth: string;
}
