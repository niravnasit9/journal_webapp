import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const topstepData: PropFirmDoc = {
  id: "topstep",
  name: "Topstep",
  slug: "topstep",
  website_url: "https://topstep.com",
  is_active: true,
  is_popular: true,
  display_order: 16,
  plans: [],
  rules: []
};

const sizes = [50000, 100000, 150000];

// Combine (Futures)
sizes.forEach(size => {
  topstepData.plans!.push({
    id: `ts-combine-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "ts-combine",
    program_name: "Trading Combine",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 2,
    max_drawdown_pct: 4,
    drawdown_type: "eod",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  topstepData.plans!.push({
    id: `ts-combine-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "ts-combine",
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
topstepData.rules!.push({
  id: "ts-profit-target",
  title: "Profit Target",
  description: "6% profit target.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

topstepData.rules!.push({
  id: "ts-eod-drawdown",
  title: "End of Day Drawdown",
  description: "Drawdown is calculated at the end of the trading day, trailing up to initial balance.",
  is_hidden: false,
  verification_status: "verified"
});

topstepData.rules!.push({
  id: "ts-daily-loss",
  title: "Daily Loss Limit",
  description: "Hitting the daily loss limit will suspend trading for the day, but doesn't fail the account in the Combine (only funded).",
  is_hidden: false,
  verification_status: "verified"
});

topstepData.rules!.push({
  id: "ts-consistency",
  title: "Consistency Rule",
  description: "Profits must be consistent; your best day must be below 50% of your total profits to request a payout.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});

topstepData.rules!.push({
  id: "ts-news",
  title: "News Trading",
  description: "Allowed in Combine. Restricted during major events on Funded level.",
  is_hidden: false,
  verification_status: "verified"
});
