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
  swap: number;
  strategy_tag: string;
  notes: string;
  screenshot_url: string;
  mistake_tags: string[];
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
  owner_photo_url?: string;
}
