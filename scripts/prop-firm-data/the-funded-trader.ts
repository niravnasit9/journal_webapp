import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const theFundedTraderData: PropFirmDoc = {
  id: "the-funded-trader",
  name: "The Funded Trader",
  slug: "the-funded-trader",
  website_url: "https://thefundedtraderprogram.com",
  is_active: true,
  is_popular: false,
  display_order: 15,
  plans: [],
  rules: []
};

const sizes = [5000, 10000, 25000, 50000, 100000, 200000, 400000];

// Standard Challenge (2-Step)
sizes.forEach(size => {
  theFundedTraderData.plans!.push({
    id: `tft-standard-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "tft-standard",
    program_name: "Standard Challenge",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
  theFundedTraderData.plans!.push({
    id: `tft-standard-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "tft-standard",
    program_name: "Standard Challenge",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
  theFundedTraderData.plans!.push({
    id: `tft-standard-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "tft-standard",
    program_name: "Standard Challenge",
    account_size: size,
    phase_id: "funded",
    phase_name: "Funded",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "equity",
    rule_version_id: "v1"
  });
});

// Rules
theFundedTraderData.rules!.push({
  id: "tft-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "10% profit target.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

theFundedTraderData.rules!.push({
  id: "tft-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "5% profit target.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

theFundedTraderData.rules!.push({
  id: "tft-limits",
  title: "Drawdown Limits",
  description: "5% Daily Loss Limit (Equity based), 10% Max Drawdown.",
  is_hidden: false,
  verification_status: "verified"
});

theFundedTraderData.rules!.push({
  id: "tft-min-days",
  title: "Minimum Trading Days",
  description: "3 minimum trading days required per phase.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

theFundedTraderData.rules!.push({
  id: "tft-news-weekend",
  title: "News & Weekend Trading",
  description: "News trading allowed. Weekend holding is allowed for standard accounts.",
  is_hidden: false,
  verification_status: "verified"
});
