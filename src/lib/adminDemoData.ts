import { AccountDoc, TradeDoc, SupportTicketDoc, TicketMessageDoc, StrategyDoc, GoalDoc } from "./firebase/schema";

// Helper for dynamic dates so the demo always looks fresh
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const DEMO_ACCOUNTS: any[] = [
  {
    id: 'acc-1',
    owner_uid: 'admin_preview_user',
    label: 'Funded $100k',
    account_type: 'funded',
    currency: "USD",
    initial_balance: 100000,
    current_balance: 106500,
    highest_equity: 108200, 
    daily_loss_limit_pct: 5,
    current_floating_pnl: -1200,
    is_trailing: true,
    status: 'active',
    drawdown_type: "trailing"
  },
  {
    id: 'acc-2',
    owner_uid: 'admin_preview_user',
    label: '$50k Evaluation',
    account_type: 'evaluation',
    currency: "USD",
    initial_balance: 50000,
    current_balance: 51200,
    highest_equity: 52000,
    daily_loss_limit_pct: 5,
    current_floating_pnl: 0,
    is_trailing: false,
    status: 'active',
    drawdown_type: "static"
  },
  {
    id: 'acc-3',
    owner_uid: 'admin_preview_user',
    label: '$25k Challenge (Danger)',
    account_type: 'evaluation',
    currency: "USD",
    initial_balance: 25000,
    current_balance: 23800,
    highest_equity: 25000,
    daily_loss_limit_pct: 5, 
    current_floating_pnl: -1240, 
    is_trailing: true,
    status: 'active',
    drawdown_type: "trailing"
  }
];

export const DEMO_STRATEGIES: StrategyDoc[] = [
  {
    id: "strat_demo_1",
    owner_uid: "admin_preview_user",
    name: "Supply & Demand / SMC",
    description: "Trading off premium/discount zones in alignment with higher timeframe order flow. Waiting for a change of character (CHOCH) on the 15m before entry.",
    rules: ["Identify 4H trend", "Find unmitigated 15m order block", "Wait for 1m CHOCH entry", "Risk max 1% per trade"],
    created_at: daysAgo(40),
    updated_at: daysAgo(10),
    is_public: false
  },
  {
    id: "strat_demo_2",
    owner_uid: "admin_preview_user",
    name: "London Breakout",
    description: "Capturing momentum during the first 2 hours of the London session. Stop loss strictly placed below the Asian session range.",
    rules: ["Only trade GBP/USD or EUR/USD", "Wait for first 15m candle close outside Asian range", "1:2 Minimum RR"],
    created_at: daysAgo(60),
    updated_at: daysAgo(30),
    is_public: true
  },
  {
    id: "strat_demo_3",
    owner_uid: "admin_preview_user",
    name: "Revenge Trading (Mistake)",
    description: "Not a real strategy. Automatically tagged when a trade is taken within 5 minutes of a loss in the opposite direction.",
    rules: ["Avoid doing this at all costs"],
    created_at: daysAgo(100),
    updated_at: daysAgo(5),
    is_public: false
  }
];

export const DEMO_GOALS: GoalDoc[] = [
  {
    id: "goal_demo_1",
    owner_uid: "admin_preview_user",
    title: "Pass FundedNext 50k Challenge",
    type: "profit_target",
    target_value: 54000,
    current_value: 53900,
    deadline: daysAgo(-15),
    status: "active",
    created_at: daysAgo(12),
    updated_at: hoursAgo(2)
  },
  {
    id: "goal_demo_2",
    owner_uid: "admin_preview_user",
    title: "Maintain 60% Win Rate this month",
    type: "win_rate",
    target_value: 60,
    current_value: 64.5,
    status: "active",
    created_at: daysAgo(20),
    updated_at: daysAgo(1)
  },
  {
    id: "goal_demo_3",
    owner_uid: "admin_preview_user",
    title: "Trade 10 days without breaking rules",
    type: "trading_days",
    target_value: 10,
    current_value: 10,
    status: "completed",
    created_at: daysAgo(50),
    updated_at: daysAgo(40)
  }
];

// Helper to generate 25-30 trades per account
export const generateTradesForAccount = (accountId: string, startDay: number, count: number, winRate: number, baseLot: number): TradeDoc[] => {
  const trades: TradeDoc[] = [];
  const symbols = ["EURUSD", "GBPUSD", "XAUUSD", "US30", "NAS100"];
  const emotions: any[] = ["Confident", "Neutral", "FOMO", "Revenge", "Bored", "Tilted"];
  const grades: any[] = ["A+", "A", "B", "C"];
  
  for (let i = 0; i < count; i++) {
    const isWin = Math.random() < winRate;
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    let direction: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
    const lotSize = baseLot * (0.8 + Math.random() * 0.5); 
    let pips = isWin ? Math.random() * 50 + 10 : -(Math.random() * 40 + 5);
    
    // Create one extreme outliar per account
    if (i === 0) pips = isWin ? 250 : -150;
    if (i === Math.floor(count / 2)) pips = isWin ? 150 : -80;
    
    const openPrice = symbol.includes("USD") ? (1.05 + Math.random() * 0.2) : (symbol.includes("XAU") ? 2300 + Math.random() * 100 : 38000 + Math.random() * 1000);
    const closePrice = direction === "BUY" ? openPrice + (pips * 0.0001) : openPrice - (pips * 0.0001);
    
    const stopLossPrice = direction === "BUY" ? openPrice - (20 * 0.0001) : openPrice + (20 * 0.0001);
    const takeProfitPrice = direction === "BUY" ? openPrice + (40 * 0.0001) : openPrice - (40 * 0.0001);
    const riskRewardRatio = 2.0 + Math.random();
    
    // Simulate highest/lowest for MFE/MAE
    const volatility = Math.abs(pips * 0.0001) * 1.5;
    const highestPriceReached = Math.max(openPrice, closePrice) + (Math.random() * volatility);
    const lowestPriceReached = Math.min(openPrice, closePrice) - (Math.random() * volatility);

    const mfePips = isWin ? pips + (Math.random() * 20) : (Math.random() * 15);
    
    const maePips = isWin ? -(Math.random() * 15) : pips - (Math.random() * 20);
    const mfeUsd = mfePips * lotSize * 10;
    const maeUsd = maePips * lotSize * 10;

    const newsEvents = ["US CPI Release", "NFP Report", "FOMC Meeting", "ECB Press Conference", null, null, null];
    const newsEvent = newsEvents[Math.floor(Math.random() * newsEvents.length)];
    const impact = newsEvent ? "HIGH" : null;
    const newsVolatilityFlag = !!newsEvent;

    const tradeDay = startDay - Math.floor((i / count) * startDay);
    
    let closeDate = new Date(Date.now() - tradeDay * 24 * 60 * 60 * 1000);
    let openDate = new Date(closeDate.getTime() - (Math.random() * 4 * 60 * 60 * 1000)); // 0-4 hours earlier
    
    // Massive outlier should have a realistic long duration (e.g. 3 days)
    if (i === 0) {
      openDate = new Date(closeDate.getTime() - (3 * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000));
    }
    
    // Force 10% of trades to be Friday afternoon (local time) to trigger Tilt Analyzer
    if (i % 10 === 0) {
      // Find the most recent Friday
      while (closeDate.getDay() !== 5) {
        closeDate.setDate(closeDate.getDate() - 1);
      }
      // Set to 15:30 local time
      closeDate.setHours(15, 30, 0, 0);
      openDate = new Date(closeDate.getTime() - (2 * 60 * 60 * 1000)); // 13:30
      
      // Force these to be losses to trigger the pattern
      pips = -Math.abs(pips || 20);
      direction = "BUY";
    }
    
    // Trigger Revenge Trading for 2 consecutive losses (i = 5 and 6)
    if (i === 5 || i === 6) {
      pips = -Math.abs(pips || 20);
      direction = "SELL";
      if (i === 6) {
        openDate = new Date(closeDate.getTime() + (5 * 60 * 1000)); // 5 mins after trade 5 close
        closeDate = new Date(openDate.getTime() + (10 * 60 * 1000));
      } else {
        closeDate = new Date(openDate.getTime() + (20 * 60 * 1000));
      }
    }

    const profitLoss = pips * lotSize * 10;
    const isLoss = pips < 0;

    let executionScore = "None";
    if (Math.random() < 0.15) {
      executionScore = Math.random() > 0.5 ? "FOMO" : "Early Entry";
    } else if (isWin && Math.random() > 0.5) {
      executionScore = "Perfect";
    }

    trades.push({
      id: `trd_demo_gen_${accountId}_${i}`,
      account_id: accountId,
      symbol,
      direction,
      lot_size: Number(lotSize.toFixed(2)),
      open_price: Number(openPrice.toFixed(5)),
      close_price: Number(closePrice.toFixed(5)),
      highest_price_reached: Number(highestPriceReached.toFixed(5)),
      lowest_price_reached: Number(lowestPriceReached.toFixed(5)),
      mfe_pips: Number(mfePips.toFixed(1)),
      mae_pips: Number(maePips.toFixed(1)),
      mfe_usd: Number(mfeUsd.toFixed(2)),
      mae_usd: Number(maeUsd.toFixed(2)),
      stop_loss_price: Number(stopLossPrice.toFixed(5)),
      take_profit_price: Number(takeProfitPrice.toFixed(5)),
      risk_reward_ratio: Number(riskRewardRatio.toFixed(2)),
      execution_score: executionScore as any,
      news_event: newsEvent,
      impact: impact,
      news_volatility_flag: newsVolatilityFlag,
      open_time: openDate.toISOString(),
      close_time: closeDate.toISOString(),
      pips: Number(pips.toFixed(1)),
      profit_loss: Number(profitLoss.toFixed(2)),
      commission: Number((-lotSize * 3).toFixed(2)),
      swap: isLoss ? 0 : Number((-Math.random() * 5).toFixed(2)),
      magic_number: `00${Math.floor(Math.random() * 5)}`,
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
      setup_grade: grades[Math.floor(Math.random() * grades.length)],
      strategy_id: !isLoss ? "Supply & Demand / SMC" : (pips < -40 ? "Revenge Trading (Mistake)" : "London Breakout"),
      notes: !isLoss ? "Great setup. Followed the plan perfectly." : "Missed the entry and chased it. Stop loss hit.",
      screenshot_url: "",
      mistake_tags: !isLoss ? [] : ["Chasing Price", "Impatient"]
    });
  }
  return trades;
};

// Generate Trades
const fundedTrades = generateTradesForAccount("acc_demo_funded_100k", 45, 30, 0.65, 10.0);
const evalTrades = generateTradesForAccount("acc_demo_eval_50k", 12, 25, 0.55, 5.0);
const blownTrades = generateTradesForAccount("acc_demo_blown_25k", 60, 20, 0.25, 15.0);

export const DEMO_TRADES: TradeDoc[] = [
  ...fundedTrades,
  ...evalTrades,
  ...blownTrades,
  {
    id: "trd_demo_massive_win",
    account_id: "acc_demo_funded_100k",
    symbol: "XAUUSD",
    direction: "BUY",
    lot_size: 15.0,
    open_price: 2310.50,
    close_price: 2327.46,
    open_time: daysAgo(2),
    close_time: daysAgo(1),
    pips: 169.6,
    profit_loss: 25440.00,
    commission: -105.00,
    swap: -12.50,
    magic_number: "001",
    emotion: "Confident",
    setup_grade: "A+",
    strategy_id: "Supply & Demand / SMC",
    notes: "Perfect institutional order flow entry. Held overnight despite swap fees because the higher timeframe structure was undeniably bullish. This is an extremely long note specifically designed to test the layout wrapping capabilities of the user interface. It should wrap nicely to the next line without breaking the flexbox layout, causing any horizontal scrolling, or overlapping with other elements on the screen.",
    screenshot_url: "https://example.com/mock-trade.png",
    mistake_tags: []
  },
  {
    id: "trd_demo_severe_loss",
    account_id: "acc_demo_blown_25k",
    symbol: "US30",
    direction: "BUY",
    lot_size: 20.0,
    open_price: 38500.00,
    close_price: 38459.00,
    open_time: daysAgo(15),
    close_time: daysAgo(15),
    pips: -41.0,
    profit_loss: -8200.00,
    commission: -140.00,
    swap: 0,
    magic_number: "999",
    emotion: "Revenge",
    setup_grade: "C",
    strategy_id: "Revenge Trading (Mistake)",
    notes: "I completely lost my mind here. Doubled my lot size after taking a loss trying to make it back instantly. Blew the entire evaluation challenge in 3 minutes.",
    screenshot_url: "",
    mistake_tags: ["Revenge Trading", "Over-leveraged", "Ignored Stop Loss"]
  }
];

export const DEMO_TRANSACTIONS: any[] = [
  {
    id: "tx_demo_1",
    user_id: "admin_preview_user",
    tier: "elite",
    amount: 49.99,
    currency: "USD",
    status: "completed",
    payment_method: "Crypto",
    created_at: daysAgo(30),
    transaction_id: "0xMockHashA1B2C3D4E5F6",
    network: "Polygon",
    plan_duration: "monthly"
  },
  {
    id: "tx_demo_2",
    user_id: "admin_preview_user",
    tier: "pro",
    amount: 19.99,
    currency: "USD",
    status: "completed",
    payment_method: "Stripe",
    created_at: daysAgo(60),
    transaction_id: "ch_MockStripeCharge123",
    plan_duration: "monthly"
  }
];

export const DEMO_TICKETS: SupportTicketDoc[] = [
  {
    id: "tic_demo_1",
    user_id: "admin_preview_user",
    user_email: "preview@admin.com",
    subject: "Missing MT5 connection for my Evaluation",
    status: "open",
    created_at: hoursAgo(5),
    updated_at: hoursAgo(1)
  },
  {
    id: "tic_demo_2",
    user_id: "admin_preview_user",
    user_email: "preview@admin.com",
    subject: "Drawdown calculation discrepancy on TrueForexFunds",
    status: "closed",
    created_at: daysAgo(10),
    updated_at: daysAgo(9)
  }
];

export const DEMO_MESSAGES: TicketMessageDoc[] = [
  {
    id: "msg_demo_1",
    ticket_id: "tic_demo_1",
    sender_id: "admin_preview_user",
    sender_role: "user",
    message: "Hi, I just connected my FundedNext evaluation account but the latest trades from this morning aren't syncing. Is there a delay on the MetaApi side?",
    created_at: hoursAgo(5)
  },
  {
    id: "msg_demo_2",
    ticket_id: "tic_demo_1",
    sender_id: "support_agent",
    sender_role: "admin",
    message: "Hello! There is currently a known minor delay with the broker's read-only server. It should catch up within the hour. We are monitoring it closely.",
    created_at: hoursAgo(1)
  }
];

export const DEMO_TILT_INSIGHTS = {
  score: 78,
  status: "Mild Tilt Detected",
  patterns: [
    {
      type: "Revenge Trading",
      description: "You lose 72% of trades taken within 10 minutes of a major loss. Lot sizing increases by an average of 2x on these trades.",
      severity: "high"
    },
    {
      type: "Time-of-Day Pattern",
      description: "Your win rate drops from 55% to 22% on trades taken after 2:00 PM EST on Fridays.",
      severity: "medium"
    }
  ],
  actionableRules: [
    "Implement a mandatory 30-minute walkaway rule after any loss exceeding 1R.",
    "Disable trading terminal on Fridays after 1:00 PM EST.",
    "Hard-cap lot sizes to 1.0 standard lot following a losing streak of 2 or more."
  ]
};
