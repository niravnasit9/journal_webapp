import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const myFundedFXData: PropFirmDoc = {
  id: "myfundedfx",
  name: "MyFundedFX",
  slug: "myfundedfx",
  website_url: "https://myfundedfx.com",
  is_active: true,
  is_popular: false,
  display_order: 14,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 25000, 50000, 100000, 300000];

// 2-Step Normal
sizes.forEach(size => {
  myFundedFXData.plans!.push({
    id: `mffx-2step-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "mffx-2step",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
  myFundedFXData.plans!.push({
    id: `mffx-2step-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "mffx-2step",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
  myFundedFXData.plans!.push({
    id: `mffx-2step-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "mffx-2step",
    program_name: "2-Step Normal",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 8,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
});

// Rules
myFundedFXData.rules!.push({
  id: "mffx-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "8% profit target.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

myFundedFXData.rules!.push({
  id: "mffx-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "5% profit target.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

myFundedFXData.rules!.push({
  id: "mffx-limits",
  title: "Drawdown Limits",
  description: "5% Daily Loss Limit (Equity based), 8% Max Drawdown.",
  is_hidden: false,
  verification_status: "verified"
});

myFundedFXData.rules!.push({
  id: "mffx-min-days",
  title: "Minimum Trading Days",
  description: "1 minimum trading day required.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

myFundedFXData.rules!.push({
  id: "mffx-news-weekend",
  title: "News & Weekend Trading",
  description: "Allowed across all normal accounts.",
  is_hidden: false,
  verification_status: "verified"
});
