import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const tradeDayData: PropFirmDoc = {
  id: "tradeday",
  name: "TradeDay",
  slug: "tradeday",
  website_url: "https://tradeday.com",
  is_active: true,
  is_popular: false,
  display_order: 13,
  plans: [],
  rules: []
};

const sizes = [10000, 25000, 50000, 100000, 150000, 250000];

// Evaluation (1-Step Futures)
sizes.forEach(size => {
  tradeDayData.plans!.push({
    id: `td-eval-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "td-eval",
    program_name: "Evaluation",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 2, // Example approx limits for futures
    max_drawdown_pct: 4,
    drawdown_type: "eod",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  tradeDayData.plans!.push({
    id: `td-eval-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "td-eval",
    program_name: "Funded",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 2,
    max_drawdown_pct: 4,
    drawdown_type: "eod",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
tradeDayData.rules!.push({
  id: "td-profit-target",
  title: "Profit Target",
  description: "Varies by account size (approx 6-10%).",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

tradeDayData.rules!.push({
  id: "td-eod-drawdown",
  title: "End of Day Drawdown",
  description: "Drawdown is calculated at the end of the trading day, not intraday.",
  is_hidden: false,
  verification_status: "verified"
});

tradeDayData.rules!.push({
  id: "td-min-days",
  title: "Minimum Trading Days",
  description: "Must trade for a minimum of 10 days.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

tradeDayData.rules!.push({
  id: "td-consistency",
  title: "Consistency Rule",
  description: "No single day can account for more than 30% of total profits.",
  is_hidden: false,
  verification_status: "verified"
});

tradeDayData.rules!.push({
  id: "td-news",
  title: "News Trading",
  description: "Allowed on Evaluation, but restricted on Funded accounts around major reports.",
  is_hidden: false,
  verification_status: "verified"
});
