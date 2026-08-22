import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const e8MarketsData: PropFirmDoc = {
  id: "e8-markets",
  name: "E8 Markets (E8 Funding)",
  slug: "e8-markets",
  website_url: "https://e8markets.com",
  is_active: true,
  is_popular: true,
  display_order: 8,
  plans: [],
  rules: []
};

const sizes = [10000, 25000, 50000, 100000];

// E8 Track (2-Step)
sizes.forEach(size => {
  e8MarketsData.plans!.push({
    id: `e8-track-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "e8-track",
    program_name: "E8 Track",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  e8MarketsData.plans!.push({
    id: `e8-track-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "e8-track",
    program_name: "E8 Track",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  e8MarketsData.plans!.push({
    id: `e8-track-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "e8-track",
    program_name: "E8 Track",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
e8MarketsData.rules!.push({
  id: "e8-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 8% to pass Phase 1.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5% to pass Phase 2.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-daily-loss",
  title: "Daily Loss Limit",
  description: "The maximum daily loss is 4% of the initial account balance.",
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-max-loss",
  title: "Maximum Loss Limit",
  description: "The maximum loss is 8% of the initial account balance.",
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-min-days",
  title: "Minimum Trading Days",
  description: "There are 0 minimum trading days required.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-news-trading",
  title: "News Trading",
  description: "News trading is permitted.",
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-weekend",
  title: "Weekend/Overnight Holding",
  description: "Holding trades overnight and over the weekend is allowed.",
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-ea",
  title: "EA Usage",
  description: "EAs are allowed, excluding HFT and toxic arbitrage.",
  is_hidden: false,
  verification_status: "verified"
});

e8MarketsData.rules!.push({
  id: "e8-payouts",
  title: "Payout Schedule",
  description: "Payouts occur every 14 days with an 80% default profit split, scalable.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
