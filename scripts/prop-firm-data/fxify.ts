import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const fxifyData: PropFirmDoc = {
  id: "fxify",
  name: "FXIFY",
  slug: "fxify",
  website_url: "https://fxify.com",
  is_active: true,
  is_popular: true,
  display_order: 6,
  plans: [],
  rules: []
};

const sizes = [15000, 25000, 50000, 100000, 200000];

// 1-Step
sizes.forEach(size => {
  fxifyData.plans!.push({
    id: `fxify-1step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "fxify-1step",
    program_name: "1-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fxifyData.plans!.push({
    id: `fxify-1step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "fxify-1step",
    program_name: "1-Step",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// 2-Step
sizes.forEach(size => {
  fxifyData.plans!.push({
    id: `fxify-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "fxify-2step",
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
  fxifyData.plans!.push({
    id: `fxify-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "fxify-2step",
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
  fxifyData.plans!.push({
    id: `fxify-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "fxify-2step",
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

// Rules
fxifyData.rules!.push({
  id: "fxify-profit-target-1step",
  title: "Profit Target (1-Step)",
  description: "The profit target is 10%.",
  applicable_program_ids: ["fxify-1step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-profit-target-2step-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 10%.",
  applicable_program_ids: ["fxify-2step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-profit-target-2step-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5%.",
  applicable_program_ids: ["fxify-2step"],
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5%.",
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-max-loss-1step",
  title: "Maximum Loss Limit (1-Step)",
  description: "The maximum loss limit is 6% trailing.",
  applicable_program_ids: ["fxify-1step"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-max-loss-2step",
  title: "Maximum Loss Limit (2-Step)",
  description: "The maximum loss limit is 10% static.",
  applicable_program_ids: ["fxify-2step"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-min-days",
  title: "Minimum Trading Days",
  description: "0 minimum trading days required.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fxifyData.rules!.push({
  id: "fxify-payouts",
  title: "Payout Schedule",
  description: "First payout on demand. Up to 90% profit split.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
