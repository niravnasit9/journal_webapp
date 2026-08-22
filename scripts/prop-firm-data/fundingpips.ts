import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const fundingPipsData: PropFirmDoc = {
  id: "funding-pips",
  name: "Funding Pips",
  slug: "funding-pips",
  website_url: "https://fundingpips.com",
  is_active: true,
  is_popular: true,
  display_order: 4,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 25000, 50000, 100000];

// 2-Step
sizes.forEach(size => {
  fundingPipsData.plans!.push({
    id: `fpips-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "fpips-2step",
    program_name: "2-Step Evaluation",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fundingPipsData.plans!.push({
    id: `fpips-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "fpips-2step",
    program_name: "2-Step Evaluation",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fundingPipsData.plans!.push({
    id: `fpips-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "fpips-2step",
    program_name: "2-Step Evaluation",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
fundingPipsData.rules!.push({
  id: "fpips-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 8% to pass Phase 1.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5% to pass Phase 2.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5%, calculated on the balance or equity at the start of the day.",
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-max-loss",
  title: "Maximum Loss Limit",
  description: "The maximum loss limit is 10%, trailing based on highest closed balance.",
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-min-days",
  title: "Minimum Trading Days",
  description: "0 minimum trading days required.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-news",
  title: "News Trading",
  description: "News trading is permitted (but check high impact specific restrictions).",
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-weekend",
  title: "Weekend/Overnight Holding",
  description: "Overnight and weekend holding is fully permitted.",
  is_hidden: false,
  verification_status: "verified"
});

fundingPipsData.rules!.push({
  id: "fpips-payouts",
  title: "Payout Schedule",
  description: "Payouts are available every 5 days. Profit split up to 90%.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
