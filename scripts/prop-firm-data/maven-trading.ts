import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const mavenTradingData: PropFirmDoc = {
  id: "maven-trading",
  name: "Maven Trading",
  slug: "maven-trading",
  website_url: "https://maventrading.com",
  is_active: true,
  is_popular: false,
  display_order: 12,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 20000, 50000, 100000, 500000];

// Maven 1-Step
sizes.forEach(size => {
  mavenTradingData.plans!.push({
    id: `maven-1step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "maven-1step",
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
  mavenTradingData.plans!.push({
    id: `maven-1step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "maven-1step",
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

// Maven 2-Step
sizes.forEach(size => {
  mavenTradingData.plans!.push({
    id: `maven-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "maven-2step",
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
  mavenTradingData.plans!.push({
    id: `maven-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "maven-2step",
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
  mavenTradingData.plans!.push({
    id: `maven-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "maven-2step",
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
mavenTradingData.rules!.push({
  id: "maven-profit-target-1step",
  title: "Profit Target (1-Step)",
  description: "The profit target is 9%.",
  applicable_program_ids: ["maven-1step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-profit-target-2step-p1",
  title: "Profit Target Phase 1 (2-Step)",
  description: "The profit target is 9%.",
  applicable_program_ids: ["maven-2step"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-profit-target-2step-p2",
  title: "Profit Target Phase 2 (2-Step)",
  description: "The profit target is 5%.",
  applicable_program_ids: ["maven-2step"],
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-daily-loss-1step",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 4%.",
  applicable_program_ids: ["maven-1step"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-daily-loss-2step",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5%.",
  applicable_program_ids: ["maven-2step"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-max-loss-1step",
  title: "Maximum Loss Limit",
  description: "The maximum loss is 6% trailing.",
  applicable_program_ids: ["maven-1step"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-max-loss-2step",
  title: "Maximum Loss Limit",
  description: "The maximum loss is 10% static.",
  applicable_program_ids: ["maven-2step"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-min-days",
  title: "Minimum Trading Days",
  description: "0 minimum trading days required.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

mavenTradingData.rules!.push({
  id: "maven-payouts",
  title: "Payout Schedule",
  description: "First payout available after 14 days, then bi-weekly. Profit split up to 80%.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
