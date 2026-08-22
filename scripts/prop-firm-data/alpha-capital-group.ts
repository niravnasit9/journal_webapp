import { PropFirmDoc } from "../../src/lib/firebase/schema";

export const alphaCapitalData: PropFirmDoc = {
  id: "alpha-capital-group",
  name: "Alpha Capital Group",
  slug: "alpha-capital-group",
  website_url: "https://alphacapitalgroup.uk",
  is_active: true,
  is_popular: false,
  display_order: 10,
  plans: [],
  rules: []
};

const sizes = [10000, 25000, 50000, 100000, 200000];

// Alpha Pro (2-Step)
sizes.forEach(size => {
  alphaCapitalData.plans!.push({
    id: `acg-pro-${size}-p1`,
    name: `$${size.toLocaleString()}`,
    program_id: "acg-pro",
    program_name: "Alpha Pro",
    account_size: size,
    phase_id: "phase-1",
    phase_name: "Phase 1",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  alphaCapitalData.plans!.push({
    id: `acg-pro-${size}-p2`,
    name: `$${size.toLocaleString()}`,
    program_id: "acg-pro",
    program_name: "Alpha Pro",
    account_size: size,
    phase_id: "phase-2",
    phase_name: "Phase 2",
    daily_loss_limit_pct: 5,
    max_drawdown_pct: 10,
    drawdown_type: "static",
    daily_drawdown_type: "balance",
    rule_version_id: "v1"
  });
  alphaCapitalData.plans!.push({
    id: `acg-pro-${size}-funded`,
    name: `$${size.toLocaleString()}`,
    program_id: "acg-pro",
    program_name: "Alpha Pro",
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
alphaCapitalData.rules!.push({
  id: "acg-profit-target-p1",
  title: "Profit Target Phase 1",
  description: "The profit target is 8% for Phase 1.",
  applicable_phase_ids: ["phase-1"],
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-profit-target-p2",
  title: "Profit Target Phase 2",
  description: "The profit target is 5% for Phase 2.",
  applicable_phase_ids: ["phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-daily-loss",
  title: "Daily Loss Limit",
  description: "The daily loss limit is 5% based on the start of day balance.",
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-max-drawdown",
  title: "Maximum Drawdown",
  description: "The maximum total drawdown is 10%.",
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-min-days",
  title: "Minimum Trading Days",
  description: "A minimum of 0 trading days is required to pass evaluations.",
  applicable_phase_ids: ["phase-1", "phase-2"],
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-news-trading",
  title: "News Trading",
  description: "News trading is allowed.",
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-weekend-trading",
  title: "Weekend/Overnight Holding",
  description: "Overnight and weekend holding is permitted.",
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-ea",
  title: "EA Usage",
  description: "EAs and bots are permitted as long as they are not HFT, arbitrage, or tick scalping.",
  is_hidden: false,
  verification_status: "verified"
});

alphaCapitalData.rules!.push({
  id: "acg-payouts",
  title: "Payout Schedule",
  description: "Payouts are available bi-weekly with up to an 80% split.",
  applicable_phase_ids: ["funded"],
  is_hidden: false,
  verification_status: "verified"
});
