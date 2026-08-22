import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const blueGuardianData: PropFirmDoc = {
  id: "blue-guardian",
  name: "Blue Guardian",
  slug: "blue-guardian",
  website_url: "https://blueguardian.com",
  is_active: true,
  is_popular: false,
  display_order: 11,
  plans: [],
  rules: []
};

const sizes = [10000, 25000, 50000, 100000, 200000];

// Unlimited (1-Step)
sizes.forEach(size => {
  blueGuardianData.plans!.push({
    id: `bg-unlimited-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "bg-unlimited",
    program_name: "Unlimited 1-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Evaluation",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  blueGuardianData.plans!.push({
    id: `bg-unlimited-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "bg-unlimited",
    program_name: "Unlimited 1-Step",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "trailing",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
});

// Elite (2-Step)
sizes.forEach(size => {
  blueGuardianData.plans!.push({
    id: `bg-elite-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "bg-elite",
    program_name: "Elite 2-Step",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  blueGuardianData.plans!.push({
    id: `bg-elite-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "bg-elite",
    program_name: "Elite 2-Step",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 4,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  blueGuardianData.plans!.push({
    id: `bg-elite-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "bg-elite",
    program_name: "Elite 2-Step",
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
blueGuardianData.rules!.push({
  id: "bg-profit-target-1step",
  title: "Profit Target (1-Step)",
  description: "The profit target is 10% to pass the evaluation.",
  applicable_program_ids: ["bg-unlimited"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-profit-target-2step-p1",
  title: "Profit Target Phase 1 (2-Step)",
  description: "The profit target is 8% to pass Phase 1.",
  applicable_program_ids: ["bg-elite"],
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-profit-target-2step-p2",
  title: "Profit Target Phase 2 (2-Step)",
  description: "The profit target is 4% to pass Phase 2.",
  applicable_program_ids: ["bg-elite"],
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 4%.",
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-max-loss",
  title: "Maximum Loss Limit",
  description: "The maximum loss limit is 8%.",
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-min-days",
  title: "Minimum Trading Days",
  description: "There are 0 minimum trading days required to pass.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-news-trading",
  title: "News Trading",
  description: "News trading is permitted.",
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-weekend",
  title: "Weekend/Overnight Holding",
  description: "Holding trades overnight and over the weekend is fully allowed.",
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-ea",
  title: "EA Usage",
  description: "EAs and algorithmic trading are permitted.",
  is_hidden: false,
  verification_status: "verified"
});

blueGuardianData.rules!.push({
  id: "bg-payouts",
  title: "Payout Schedule",
  description: "Payouts are available bi-weekly with an 85% profit split.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
