import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const ftmo: PropFirmDoc = {
  id: "ftmo",
  name: "FTMO",
  slug: "ftmo",
  website_url: "https://ftmo.com",
  is_active: true,
  is_popular: true,
  display_order: 2,
  plans: [],
  rules: []
};

const sizes = [10000, 25000, 50000, 100000, 200000];

// 2-Step Normal
sizes.forEach(size => {
  ftmo.plans!.push({
    id: `ftmo-normal-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-normal",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  ftmo.plans!.push({
    id: `ftmo-normal-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-normal",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  ftmo.plans!.push({
    id: `ftmo-normal-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-normal",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// 2-Step Swing
sizes.forEach(size => {
  ftmo.plans!.push({
    id: `ftmo-swing-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-swing",
    program_name: "2-Step Swing",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  ftmo.plans!.push({
    id: `ftmo-swing-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-swing",
    program_name: "2-Step Swing",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  ftmo.plans!.push({
    id: `ftmo-swing-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "ftmo-swing",
    program_name: "2-Step Swing",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Rules
ftmo.rules!.push({
  id: "ftmo-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "The profit target for Phase 1 is 10%.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "The profit target for Phase 2 is 5%.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-daily-loss",
  title: "Daily Loss Limit",
  description: "The maximum daily loss limit is 5%, calculated based on the initial daily balance at midnight CE(S)T.",
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-max-loss",
  title: "Maximum Loss Limit",
  description: "The overall maximum loss limit is 10%, static from the initial account balance.",
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-min-days",
  title: "Minimum Trading Days",
  description: "You must trade for a minimum of 4 trading days.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-max-days",
  title: "Maximum Trading Days",
  description: "There is no maximum time limit to complete the evaluation.",
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-normal-news",
  title: "News Trading Restrictions",
  description: "Cannot execute new trades or close existing trades 2 minutes before or after high-impact news.",
  applicable_program_ids: ["ftmo-normal"],
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-swing-news",
  title: "News Trading Allowed",
  description: "News trading is fully permitted without restrictions.",
  applicable_program_ids: ["ftmo-swing"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-normal-weekend",
  title: "Weekend/Overnight Holding",
  description: "Holding trades over the weekend or overnight into the next trading day is not allowed.",
  applicable_program_ids: ["ftmo-normal"],
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-swing-weekend",
  title: "Weekend/Overnight Holding Allowed",
  description: "Holding trades overnight or over the weekend is allowed.",
  applicable_program_ids: ["ftmo-swing"],
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-ea",
  title: "EA & Bot Trading",
  description: "Expert Advisors (EAs) and trading bots are allowed, provided they do not use high-frequency trading (HFT), latency arbitrage, or grid strategies.",
  is_hidden: false,
  verification_status: "verified"
});

ftmo.rules!.push({
  id: "ftmo-payouts",
  title: "Payout Schedule",
  description: "First payout is available after 14 days on the funded account. Profit split is up to 90%.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
