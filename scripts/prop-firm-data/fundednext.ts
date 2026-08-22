import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const fundednext: PropFirmDoc = {
  id: "fundednext",
  name: "FundedNext",
  slug: "fundednext",
  website_url: "https://fundednext.com",
  is_active: true,
  is_popular: true,
  display_order: 3,
  plans: [],
  rules: []
};

const sizes = [6000, 15000, 25000, 50000, 100000, 200000];

// Stellar 1-Step
sizes.forEach(size => {
  fundednext.plans!.push({
    id: `fn-stellar-1step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "fn-stellar-1step",
    program_name: "Stellar 1-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 3,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fundednext.plans!.push({
    id: `fn-stellar-1step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "fn-stellar-1step",
    program_name: "Stellar 1-Step",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 3,
    max_drawdown_pct: 6,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Stellar 2-Step
sizes.forEach(size => {
  fundednext.plans!.push({
    id: `fn-stellar-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "fn-stellar-2step",
    program_name: "Stellar 2-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fundednext.plans!.push({
    id: `fn-stellar-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "fn-stellar-2step",
    program_name: "Stellar 2-Step",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  fundednext.plans!.push({
    id: `fn-stellar-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "fn-stellar-2step",
    program_name: "Stellar 2-Step",
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
fundednext.rules!.push({
  id: "fn-profit-target-1step",
  title: "Profit Target",
  description: "The profit target is 10%.",
  applicable_program_ids: ["fn-stellar-1step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-profit-target-2step-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 8%.",
  applicable_program_ids: ["fn-stellar-2step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-profit-target-2step-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5%.",
  applicable_program_ids: ["fn-stellar-2step"],
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-daily-loss-1step",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 3%, based on the initial daily balance.",
  applicable_program_ids: ["fn-stellar-1step"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-daily-loss-2step",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5%, based on the initial daily balance.",
  applicable_program_ids: ["fn-stellar-2step"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-max-drawdown-1step",
  title: "Maximum Drawdown",
  description: "The maximum trailing drawdown is 6%.",
  applicable_program_ids: ["fn-stellar-1step"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-max-drawdown-2step",
  title: "Maximum Drawdown",
  description: "The overall static maximum drawdown is 10%.",
  applicable_program_ids: ["fn-stellar-2step"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-min-days-1step",
  title: "Minimum Trading Days",
  description: "Must trade a minimum of 2 days.",
  applicable_program_ids: ["fn-stellar-1step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-min-days-2step",
  title: "Minimum Trading Days",
  description: "Must trade a minimum of 5 days.",
  applicable_program_ids: ["fn-stellar-2step"],
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-news-trading",
  title: "News Trading restrictions",
  description: "News trading is permitted, but profit from high-impact news is capped at 40% on some accounts.",
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-weekend-overnight",
  title: "Weekend/Overnight Holding",
  description: "Holding trades overnight and over the weekend is allowed.",
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-ea",
  title: "EA & Bot Trading",
  description: "EAs and bots are allowed. No HFT, copy trading, or arbitrage.",
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-consistency",
  title: "Consistency Rule",
  description: "No consistency rule on Stellar models.",
  is_hidden: false,
  verification_status: "verified"
});

fundednext.rules!.push({
  id: "fn-payouts",
  title: "Payout Schedule",
  description: "First payout available in 14-30 days depending on the program. Up to 95% profit split.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
