export interface UserDoc {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "user";
  phone?: string;
  country?: string;
  theme?: "dark" | "light";
  created_at: any; // Firestore Timestamp
  photo_url?: string;
  subscription_tier?: "free" | "starter" | "pro" | "elite";
  subscription_status?: string;
}

export interface AccountDoc {
  id: string;
  owner_uid: string;
  label: string;
  broker: string;
  account_type: string;
  currency: "USD" | "INR";
  initial_balance: number;
  current_balance: number;
  created_at: any;
  
  // Prop Firm tracking
  prop_firm?: string;
  prop_plan_name?: string;
  prop_plan_phase?: string;
  rule_version_id?: string;
  drawdown_type?: string; // e.g., 'static', 'trailing', 'end_of_day'
  daily_drawdown_type?: string; // e.g., 'balance', 'equity'
  daily_loss_limit_pct?: number;
  max_drawdown_pct?: number;
  
  // Legacy MetaApi fields (optional now)
  mt5_login?: string;
  mt5_server?: string;
  investor_password?: string;
  metaapi_account_id?: string;
  current_equity?: number;
  last_synced_at?: any;
}

export interface TradeDoc {
  id: string;
  account_id: string;
  symbol: string;
  direction: "BUY" | "SELL";
  lot_size: number;
  open_price: number;
  close_price: number;
  open_time: any;
  close_time: any;
  pips: number;
  profit_loss: number;
  commission: number;
  swap?: number;
  magic_number?: string;
  comment?: string;

  // Psychological Analytics
  emotion?: "FOMO" | "Revenge" | "Confident" | "Bored" | "Tilted" | "Neutral";
  setup_grade?: "A+" | "A" | "B" | "C";
  strategy_tag: string;
  notes: string;
  screenshot_url: string;
  mistake_tags: string[];
}

export interface PropFirmRule {
  id: string;
  title: string;
  description: string;
  
  applicable_program_ids?: string[] | null;
  applicable_phase_ids?: string[] | null;
  applicable_plan_ids?: string[] | null;
  
  is_hidden: boolean; // if true, requires premium tier
  source_url?: string;
  last_verified_at?: string; // ISO date string
  verification_status?: 'verified' | 'needs_review' | 'outdated';
  rule_version_id?: string;
}

export interface PropFirmPlan {
  id: string; // e.g., "ftmo-2step-10k"
  name: string; // e.g., "$10,000"
  program_id: string; // e.g., "ftmo-2step"
  program_name: string; // e.g., "2-Step"
  account_size: number;
  currency?: string;
  phase_id?: string | null;
  phase_name?: string | null;
  
  daily_loss_limit_pct: number;
  max_drawdown_pct: number;
  
  // Advanced Risk Engine
  drawdown_type?: 'static' | 'trailing' | 'end_of_day' | string;
  daily_drawdown_type?: 'balance' | 'equity' | string;
  purchase_price?: number;
  rule_version_id?: string; // Tracks which rule version this plan belongs to
}

export interface PropFirmDoc {
  id: string; // Document ID (e.g. FTMO, FundedNext)
  name: string;
  slug?: string;
  logo_url?: string;
  website_url?: string;
  description?: string;
  country?: string;
  is_active: boolean;
  is_popular?: boolean;
  display_order?: number;
  plans: PropFirmPlan[];
  rules: PropFirmRule[];
  created_at?: any;
  updated_at?: any;
}

export interface AccountSnapshotDoc {
  id: string;
  account_id: string;
  timestamp: any;
  balance: number;
  equity: number;
  margin: number;
  margin_level: number;
  floating_pl: number;
}

export interface FundedAccountRulesDoc {
  id: string;
  account_id: string;
  max_daily_loss_pct: number;
  max_total_drawdown_pct: number;
  profit_target_pct: number;
  current_daily_loss: number;
  current_total_drawdown: number;
}

export interface SupportTicketDoc {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  status: "open" | "closed";
  created_at: any;
  updated_at: any;
}

export interface TicketMessageDoc {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  message: string;
  created_at: any;
}

export interface StrategyDoc {
  id: string;
  owner_uid: string;
  name: string;
  description: string;
  rules: string[];
  created_at: any;
  updated_at: any;
  is_public?: boolean;
  image_url?: string;
  owner_email?: string;
  owner_name?: string;
  owner_photo_url?: string;
}

export interface GoalDoc {
  id: string;
  owner_uid: string;
  title: string;
  type: "profit_target" | "trading_days" | "win_rate" | "custom";
  target_value: number;
  current_value: number;
  deadline?: any; // Firestore Timestamp
  status: "active" | "completed" | "failed";
  created_at: any;
  updated_at: any;
}

