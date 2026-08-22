import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const goatFundedTrader: PropFirmDoc = {
  id: "goat-funded-trader",
  name: "Goat Funded Trader",
  slug: "goat-funded-trader",
  website_url: "https://goatfundedtrader.com",
  is_active: true,
  is_popular: true,
  display_order: 1,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 25000, 50000, 100000];

// 1-Step Challenge
sizes.forEach(size => {
  goatFundedTrader.plans!.push({
    id: `gft-1step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-1step",
    program_name: "1-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  goatFundedTrader.plans!.push({
    id: `gft-1step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-1step",
    program_name: "1-Step",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// 2-Step Challenge
sizes.forEach(size => {
  goatFundedTrader.plans!.push({
    id: `gft-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-2step",
    program_name: "2-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  goatFundedTrader.plans!.push({
    id: `gft-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-2step",
    program_name: "2-Step",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  goatFundedTrader.plans!.push({
    id: `gft-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-2step",
    program_name: "2-Step",
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

// Instant Funding
sizes.forEach(size => {
  goatFundedTrader.plans!.push({
    id: `gft-instant-${size}`,
    name: `$${size.toLocaleString()}`,
    program_id: "gft-instant",
    program_name: "Instant Funding",
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
goatFundedTrader.rules!.push({
  id: "gft-1step-profit",
  title: "Profit Target (1-Step)",
  description: "The profit target is 10% to pass the evaluation phase.",
  applicable_program_ids: ["gft-1step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-2step-profit-p1",
  title: "Profit Target (2-Step Phase 1)",
  description: "The profit target is 8% to pass Phase 1.",
  applicable_program_ids: ["gft-2step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-2step-profit-p2",
  title: "Profit Target (2-Step Phase 2)",
  description: "The profit target is 5% to pass Phase 2.",
  applicable_program_ids: ["gft-2step"],
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 4% (1-Step) or 5% (2-Step/Instant).",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-max-loss",
  title: "Maximum Loss Limit",
  description: "The max loss limit is 6% trailing (1-Step) or 10% static (2-Step/Instant).",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-min-days",
  title: "Minimum Trading Days",
  description: "There are 0 minimum trading days required to pass.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-news-trading",
  title: "News Trading",
  description: "News trading is allowed.",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-weekend",
  title: "Weekend/Overnight Holding",
  description: "Holding trades overnight and over the weekend is allowed.",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-ea-trading",
  title: "EA Usage",
  description: "Expert Advisors (EAs) are allowed.",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-consistency",
  title: "Consistency Rule",
  description: "No consistency rule applies.",
  is_hidden: false,
  verification_status: "verified"
});

goatFundedTrader.rules!.push({
  id: "gft-payout",
  title: "Payout Schedule",
  description: "Payouts are available on demand or bi-weekly depending on the plan. Up to 95% profit split.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
