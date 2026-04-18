export interface AtlasApiError {
  error: {
    status: number;
    code: number;
    title: string;
    detail: string;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface MeasurementDefinition {
  type: string;
  af: number;
  description?: string;
  target?: string;
  is_oneoff?: boolean;
  interval?: number;
  resolve_on_probe?: boolean;
  tags?: string[];
  // Ping-specific
  packets?: number;
  size?: number;
  packet_interval?: number;
  include_probe_id?: boolean;
  // Traceroute-specific
  protocol?: string;
  timeout?: number;
  dont_fragment?: boolean;
  paris?: number;
  first_hop?: number;
  max_hops?: number;
  port?: number;
  destination_option_size?: number;
  hop_by_hop_option_size?: number;
  // DNS-specific
  query_class?: string;
  query_type?: string;
  query_argument?: string;
  set_cd_bit?: boolean;
  set_do_bit?: boolean;
  set_nsid_bit?: boolean;
  udp_payload_size?: number;
  set_rd_bit?: boolean;
  retry?: number;
  use_probe_resolver?: boolean;
  // HTTP-specific
  header_bytes?: number;
  version?: string;
  method?: string;
  path?: string;
  query_string?: string;
  user_agent?: string;
  body_bytes?: number;
  timing_verbosity?: number;
}

export interface MeasurementCreateRequest {
  definitions: MeasurementDefinition[];
  probes: ProbeSpecification[];
  is_oneoff?: boolean;
  bill_to?: string;
  start_time?: number;
  stop_time?: number;
}

export interface ProbeSpecification {
  type: string;
  value: string | number;
  requested: number;
  tags?: { include?: string[]; exclude?: string[] };
}

export interface MeasurementResponse {
  id: number;
  type: string;
  af: number;
  description: string;
  target: string;
  target_ip: string;
  status: { id: number; name: string };
  creation_time: number;
  start_time: number;
  stop_time: number | null;
  is_oneoff: boolean;
  is_public: boolean;
  interval: number;
  probes_requested: number;
  probes_scheduled: number;
  result: string;
  tags: string[];
  [key: string]: unknown;
}

export interface ProbeResponse {
  id: number;
  address_v4: string | null;
  address_v6: string | null;
  asn_v4: number | null;
  asn_v6: number | null;
  prefix_v4: string | null;
  prefix_v6: string | null;
  country_code: string;
  status: { id: number; name: string; since: string };
  is_anchor: boolean;
  is_public: boolean;
  description: string;
  tags: Array<{ name: string; slug: string }>;
  geometry: { type: string; coordinates: [number, number] } | null;
  [key: string]: unknown;
}

export interface CreditResponse {
  current_balance: number;
  estimated_daily_income: number;
  estimated_daily_expenditure: number;
  estimated_daily_balance_change: number;
  calculation_time: string;
  estimated_runout_seconds: number | null;
  past_day_measurement_results: number;
  past_day_credits_spent: number;
  income_items: string;
  expense_items: string;
  transactions: string;
}

export interface MeasurementResult {
  fw: number;
  from: string;
  msm_id: number;
  probe_id: number;
  timestamp: number;
  type: string;
  // Ping results
  avg?: number;
  min?: number;
  max?: number;
  sent?: number;
  rcvd?: number;
  dup?: number;
  // Traceroute results
  result?: unknown[];
  // DNS results
  answers?: unknown[];
  // General
  dst_addr?: string;
  dst_name?: string;
  src_addr?: string;
  [key: string]: unknown;
}

export interface MeasurementCreateResponse {
  measurements: number[];
}
